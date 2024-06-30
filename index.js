require('dotenv').config()
const express = require("express");
const { google } = require("googleapis")
const app = express()
const mongoose = require('mongoose')
const userRoutes = require('./routes/user')
app.use(express.json());

const threeHoursLabs = ["AMP", "CCP", "DE", "IEM", "TAPDS", "DOE", "G3D", "SECR", "RC", "TIVM", "BTM", "TPSVLSI", "3DG", "CA"]; 
const fourHoursLabs = ["PBD", "EIM", "CAD", "RS", "MEI", "MI", "IM"]; 
async function getSheetsNames(auth, spreadSheetId){
    const sheets = google.sheets({ version: "v4", auth: auth});
    const response = await sheets.spreadsheets.get({
        spreadsheetId: spreadSheetId,
        fields: "sheets.properties.title"
    });
    return response.data.sheets.map(sheet => sheet.properties.title);
}
async function getSheetColumnsAndLinesNumber(auth, spreadSheetId, sheetName) {
    const sheets = google.sheets({ version: "v4", auth: auth });
    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadSheetId
        });

        const sheet = response.data.sheets.find(sheet => sheet.properties.title === sheetName);
        if (!sheet) {
            throw new Error(`Sheet '${sheetName}' not found.`);
        }

        const properties = sheet.properties;
        const rowCount = properties.gridProperties.rowCount;
        const columnCount = properties.gridProperties.columnCount;
        console.log("[DEBUG] RowCount:", rowCount, "; ColumnCount:", columnCount, "for sheet:", sheetName);
        return { rowCount, columnCount };
    } catch (err) {
        console.error('The API returned an error:', err);
        return { rowCount: 0, columnCount: 0 };
    }
}
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
async function getDayRange(auth, spreadSheetId, an, zi, columnCount) {
    const sheets = google.sheets({ version: "v4", auth: auth });
    const sheetName = "AN " + an;
    const range = sheetName + "!A1:A" + columnCount;
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: range
    });
    const values = response.data.values;
    console.log("Zile Range: " + values);
    for(let i = 0; i < values.length ; i++){
        if(values[i].length !== 0){
            if(values[i][0].toLowerCase() === zi){
                console.log("Inceput zi: " + i);
                console.log("Sfarsit zi: " + i + 12);
                return [i + 1, i + 13];
            }//else if(values[i][0].toLowerCase() === zi){
            //     console.log("Inceput zi: " + i);
            //     console.log("Sfarsit zi: " + i + 12);
            //     return [i + 2, i + 13];
            // }
        }
    }
    console.log(`Day '${zi}' not found in the spreadsheet.`);
    return null;
}

//get next column of the spreadsheet
function nextColumn(column) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const base = alphabet.length;

    // Convert column label to array of characters
    const chars = column.split('');

    // Start from the last character
    for (let i = chars.length - 1; i >= 0; i--) {
        let charIndex = alphabet.indexOf(chars[i]);

        // Increment the character
        charIndex++;

        // Check if carry-over is needed
        if (charIndex >= base) {
            chars[i] = alphabet[charIndex % base]; // Set the character
        } else {
            chars[i] = alphabet[charIndex]; // Set the character
            break; // No carry-over needed, exit loop
        }

        // If this is the first character and carry-over is needed, insert 'A' at the beginning
        if (i === 0) {
            chars.unshift('A');
        }
    }

    return chars.join('');
}
async function getDailyScheduleOfGroup(auth, spreadSheetId, an, zi, columnCount, grupa, seria, saptamana) {
    let objectToReturn = {};
    const sheets = google.sheets({ version: "v4", auth: auth });

    const dayRange = await getDayRange(auth, spreadSheetId, an, zi, columnCount);
    const [verticalStart, verticalEnd] = dayRange;
    console.log("Vertical Start: " + verticalStart);
    console.log("Vertical End: " + verticalEnd);
    const serieRange = await getSeriesRanges(auth, spreadSheetId, an, seria);
    const [horizontalStart, horizontalEnd] = serieRange.interval;
    let [horizontalStartCursuri, horizontalEndCursuri] = 'undefined';
    if(an === 3 && seria === 'G') {
        const serieRangeCurs = await getSeriesRanges(auth, spreadSheetId, an, 'F');
        [horizontalStartCursuri, horizontalEndCursuri] = serieRangeCurs.interval;
    }  
    if(an === 4 && seria === 'D')  fourHoursLabs.push("ASC");
    console.log("4 hour labs: " + fourHoursLabs);
    const sheetName = "AN " + an;

    const rangeGrupe = `${sheetName}!${horizontalStart}2:${horizontalEnd}2`;
    const grupeResponse = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: rangeGrupe
    });
    const grupeValues = grupeResponse.data.values[0]; 
    console.log("Grupe: " + grupeValues)
    let grupaColumnIndex = grupeValues.findIndex(value => value === grupa);
    
    if (grupaColumnIndex === -1) {
        return `Grupa '${grupa}' not found in the specified range.`;
    }

    const columnArray = getColumnArray(horizontalStart, horizontalEnd);
    let range = `${sheetName}!${columnArray[grupaColumnIndex]}${verticalStart}:${columnArray[grupaColumnIndex]}${verticalEnd}`;
    if(grupa.endsWith('b')) range = `${sheetName}!${columnArray[grupaColumnIndex - 1]}${verticalStart}:${columnArray[grupaColumnIndex]}${verticalEnd}`;
    
    const groupSchedule = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: range
    });

    const rangeCursuri = an === 3 && seria === 'G' ? `${sheetName}!${horizontalStartCursuri}${verticalStart}:${horizontalStartCursuri}${verticalEnd}`:`${sheetName}!${horizontalStart}${verticalStart}:${horizontalStart}${verticalEnd}`;
    const coursesSchedule = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: rangeCursuri
    });

    const values = groupSchedule.data.values;
    
    const valuesCursuri = coursesSchedule.data.values;
    
    console.log('Values: {}', values);
    console.log('Values cursuri: {}', valuesCursuri);
    let intervaleLaboratoare = "";
    let intervaleCursuri = "";
    let intervaleMaterii = [];
    const rangeOre = `${sheetName}!B${verticalStart}:B${verticalEnd}`;
    const ore = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: rangeOre
    });
    console.log("ORE: " +  ore.data.values.map(subArray => subArray[0])[0]);
    if(valuesCursuri !== undefined) intervaleCursuri = parseCursuri(valuesCursuri, saptamana, ore.data.values.map(subArray => subArray[0]));
    //console.log("Intervale cursuri: " + JSON.stringify(intervaleCursuri));
    if(values !== undefined)  intervaleLaboratoare = parseLabs(values, saptamana, ore.data.values.map(subArray => subArray[0]));
    //console.log("Intervale labs: " + JSON.stringify(intervaleLaboratoare));
    if(values !== undefined && valuesCursuri !== undefined) intervaleMaterii = mergeAndSortArrays(intervaleCursuri, intervaleLaboratoare);
    else if(values !== undefined) intervaleMaterii = intervaleLaboratoare;
    else if(valuesCursuri !== undefined) intervaleMaterii = intervaleCursuri;
    objectToReturn.numeOrar = `Orar anul '${an}' Seria '${seria}'.`;
    objectToReturn.zi = zi;
    objectToReturn.saptamana = saptamana;
    objectToReturn.grupa = grupa;
    if(intervaleMaterii.length !== 0 ) objectToReturn.orar = mergeOrarEntries(intervaleMaterii);
    else objectToReturn.orar = intervaleMaterii;
    //console.log("Intervale materii: " +JSON.stringify(intervaleMaterii));
    //console.log("Object orar: " + JSON.stringify(objectToReturn));
    return objectToReturn;
}
function mergeAndSortArrays(array1, array2) {
    // Concatenate the two arrays
    const mergedArray = array1.concat(array2);

    // Sort the merged array based on the "ora" field
    mergedArray.sort((a, b) => {
        // Split the "ora" field to get the start hour
        const startHourA = parseInt(a.ora.split('-')[0]);
        const startHourB = parseInt(b.ora.split('-')[0]);

        // Compare the start hours
        return startHourA - startHourB;
    });
    //console.log("MergedArray: " + JSON.stringify(mergedArray));
    return mergedArray;
}

function getColumnArray(start, end) {
    let columnLetter = start;
    const columnArray = [];
    while (columnLetter < end || columnLetter.length < end.length) {
        columnArray.push(columnLetter);
        columnLetter = nextColumn(columnLetter);
    }
    return columnArray;
}

function parseLabs(laboratoare, saptamana, ore) {
    const intervaleMaterii = [];
    const regexLinieNoua = /[\r\n]+/;
    const regexSala = /^[AB]\d{2,3}[ab]?$/;
    const regexSalaCalculatoare = /^S\d+\sCalc$|^S\d+\sCalc$|^S\d+\sCALC$/i;
    const regexGrupa = /^4\d{2}[A-G][ab]$/;
    for (let i = 0; i < laboratoare.length; i++) {
        const materieOra = laboratoare[i];
        if (materieOra.length === 0 || materieOra[0].includes("curs")  || materieOra[0].includes("lecture") || materieOra[0].includes("(c)") ||regexGrupa.test(materieOra)) continue;
        //if (laboratoare[i+1] !== undefined && laboratoare[i+1].length !== 0) timeRange = ore[i];
        const semigrupa = materieOra.length === 2 ? materieOra[1] : materieOra[0];
        let materie = '';
        let sala = '';
        
        //check if element has 2 lines
        if(regexLinieNoua.test(semigrupa)) {
            const randuriElement = semigrupa.split(/[\r\n]+/).map(element => element.trim());
            if (!semigrupa.includes('/')) {
                materie = randuriElement[0];
                sala = randuriElement[1];
                //check if every line contains only one subject    
            }else if(!randuriElement[1].includes('/')) {
                sala = randuriElement[1];
                materie = saptamana === 'impar' ? randuriElement[0].split('/')[0].trim() : randuriElement[0].split('/')[1].trim();
            }else if(randuriElement[0].slice(-1) !== '/'){
                materie = saptamana === 'impar' ? randuriElement[0].split('/')[0].trim() : randuriElement[0].split('/')[1].trim();
                sala = saptamana === 'impar' ? randuriElement[1].split('/')[0].trim() : randuriElement[1].split('/')[1].trim();
            }else {
                const newText = saptamana === 'impar' ? randuriElement[0].replace('/', '').trim() : randuriElement[1].replace('/', '').trim();
                const lastCharactersArray = newText.split(' ');
                const lastCharacters = lastCharactersArray[lastCharactersArray.length - 1];
                if(regexSala.test(lastCharacters) || regexSalaCalculatoare.test(lastCharacters)){ 
                    sala = lastCharacters;
                    materie = newText.substring(0, newText.indexOf(lastCharacters)).trim();
                }else{
                    materie = newText;
                    sala = '--';
                }    
            }
        } else if(semigrupa.includes('/')){
            const indexSlash = semigrupa.indexOf('/');
            materie = saptamana === 'impar' ? semigrupa.substring(0, indexSlash).trim() : semigrupa.substring(indexSlash+1).trim();
        } else{
            const lastSpace = semigrupa.trim().lastIndexOf(' ');
            const lastCharacters = semigrupa.substring(lastSpace + 1);
            if(regexSala.test(lastCharacters) || regexSalaCalculatoare.test(lastCharacters)){ 
                sala = lastCharacters;
                materie = semigrupa.substring(0, lastSpace);
            }else{
                materie = semigrupa;
                sala = '--';
            }
        }   
        let materieTrimmed = '';
        let index = materie.indexOf('(');
        if (index !== -1) materieTrimmed = materie.substring(0, index).trim();

        const timeRange = threeHoursLabs.some(element => element === materieTrimmed) ? extendTimeRange(ore[i], 2) : fourHoursLabs.some(element => element === materieTrimmed) ? extendTimeRange(ore[i], 3) : extendTimeRange(ore[i], 1); 
        
        console.log('Materie: ' + materieTrimmed);
        if (materie.length !== 0 && !materie.includes('--')){ 
            intervaleMaterii.push({ "ora": timeRange, "materie": materie, "sala": sala }); 
            if(laboratoare[i+1] && laboratoare[i+1].length !== 0 && laboratoare[i+1][0].includes(materieTrimmed)) i += 2;
            else if(laboratoare[i+2] && laboratoare[i+2].length  !== 0 && laboratoare[i+2][0].includes(materieTrimmed)) i +=3;
        }
        
    }
    return intervaleMaterii;
}

function parseCursuri(valuesCursuri, saptamana, ore) {
    const intervaleMaterii = [];
    const newlineRegex = /[\r\n]+/;
    const regexGrupa = /^4\d{2}[A-G][ab]$/;

    for (let i = 0; i < valuesCursuri.length; i++) {
        const element = valuesCursuri[i][0];
        if (element && !regexGrupa.test(element)) {
            if (element.includes("(c)") && (element.includes("|") || element.toLowerCase().includes("opt"))) {
                intervaleMaterii.push({ "ora": extendTimeRange(ore[i], 1), "materie": element });
            }else if(element.includes('||')){
                intervaleMaterii.push({ "ora": extendTimeRange(ore[i], 1), "materie": element.replace(newlineRegex, '') });
            // }else if(element.includes('O2')){ 
            //     const elementsPerParity = element.replace(newlineRegex, ' ').split(' ');  
            //     console.log('ElementsParity: ' + elementsPerParity); 
            }else if (element.includes("curs") || element.includes("lecture")) {
                let materie = '';
                let profesor = '';
                //check if element has multiple lines
                if (newlineRegex.test(element)) {
                    const splitNewLines = element.split(newlineRegex).map(element => element.trim());
                    //check if it contains only one subject
                    if (!element.includes('/')) {
                        materie = splitNewLines[0];
                        profesor = splitNewLines[1].substring(6).trim();
                    //check if every line contains only one subject    
                    } else if(splitNewLines[1][0] === '/' && saptamana === 'impar') {
                        let profIndex = splitNewLines[0].toLowerCase().indexOf('prof.');
                        if(profIndex !== -1){
                            materie = splitNewLines[0].substring(0, profIndex).trim();
                            profesor = splitNewLines[0].substring(profIndex + 6).replace('/', '').trim();
                        }else{
                            materie = splitNewLines[0].replace('/', '').trim();
                        }
                    } else if(splitNewLines[1][0] === '/' && saptamana === 'par') {                
                        let profIndex = splitNewLines[1].toLowerCase().indexOf('prof.');
                        if(profIndex !== -1){
                            materie = splitNewLines[1].substring(1, profIndex).trim();
                            profesor = splitNewLines[1].substring(profIndex + 6).trim();
                        }else{
                            materie = splitNewLines[0].replace('/', '').trim();
                        }
                    } else {
                        const delimiterIndexLine1 = splitNewLines[0].indexOf('/');
                        const delimiterIndexLine2 = splitNewLines[1].indexOf('/');
                        materie = saptamana === 'impar' ? splitNewLines[0].substring(0, delimiterIndexLine1).trim() : splitNewLines[0].substring(delimiterIndexLine1 + 1).trim();
                        profesor = saptamana === 'impar' ? splitNewLines[1].substring(6, delimiterIndexLine2).trim() : splitNewLines[1].substring(delimiterIndexLine2 + 7).trim();
                    }
                // element has only one line    
                } else if(element.includes('/')){
                    const splitLine = element.split('/');
                    let newText = saptamana === 'impar' ? splitLine[0] : splitLine[1];
                    let profIndex =  newText.toLowerCase().indexOf('prof.');
                    if(profIndex !== -1){
                        materie = newText.substring(1, profIndex).trim();
                        profesor = newText.substring(profIndex + 6).trim();
                    }
                }  else{
                    let profIndex = element.toLowerCase().indexOf('prof.');
                    materie = element.substring(0, profIndex).trim();
                    profesor = element.substring(profIndex + 6).trim();
                }
                if (materie.length !== 0 && materie !== '--') intervaleMaterii.push({ "ora": extendTimeRange(ore[i], 1), "materie": materie, "profesor": profesor });
            }
        }
    }
    return intervaleMaterii;
}


function extendTimeRange(timeRange, amount) {
    const startTime = timeRange.split('-')[0];
    const endTime = (parseInt(timeRange.split('-')[1]) + amount).toString().padStart(2, '0');
    return `${startTime}-${endTime}`;
}
function mergeOrarEntries(orar) {
    const materieGroups = {};

    // Group objects by 'materie' field
    orar.forEach(entry => {
        if (!materieGroups[entry.materie]) {
            materieGroups[entry.materie] = [];
        }
        materieGroups[entry.materie].push(entry);
    });

    // Merge entries within each group
    const mergedOrar = [];
    for (const materie in materieGroups) {
        const entries = materieGroups[materie];
        const startTime = Math.min(...entries.map(entry => parseInt(entry.ora.split('-')[0])));
        const endTime = Math.max(...entries.map(entry => parseInt(entry.ora.split('-')[1])));
        
        // Extract sala from the entries and remove duplicates
        const sala = entries.some(entry => entry.sala) ? [...new Set(entries.map(entry => entry.sala))].filter(Boolean).join('/') : undefined;
        const profesor = entries.some(entry => entry.profesor) ? [...new Set(entries.map(entry => entry.profesor))].filter(Boolean).join('/') : undefined;
        mergedOrar.push({ ora: startTime + '-' + endTime, materie: materie, sala: sala, profesor: profesor });
    }

    return mergedOrar;
}


async function getSeriesRanges(auth, spreadSheetId, an, serie) {
    const sheets = google.sheets({ version: "v4", auth: auth });
    const sheetName = "AN " + an;
    const range = sheetName + "!B1:1";
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: range
    });
    const values = response.data.values[0];
    console.log("Values: " + values );
    const intervals = await getSeriesIntervals(values);
    console.log("Intervals:");
    intervals.forEach(interval => {
        console.log(interval);
    });
    const serieInterval = intervals.find(item => item.serie === serie);
    console.log("SERIE INTERVAL: " + serieInterval);
    return serieInterval;
}


async function getColumnLetter(index) {
    let column = '';
    while (index >= 0) {
        column = String.fromCharCode(65 + (index % 26)) + column;
        index = Math.floor(index / 26) - 1;
    }
    return column;
}
async function getSeriesIntervals(array) {
    let seriesIntervals = [];
    const series = [];
    let seriesStartIndex = null;
    let serie = null;
    let filteredArray = array.filter(element => {
        return !element || element.toLowerCase().includes("seria");
    });
    for (let i = 0; i < filteredArray.length; i++) {
        if(i === filteredArray.length - 1){
            const startLetter = await getColumnLetter(seriesStartIndex);
            const endLetter = await getColumnLetter(i + 1);
            seriesIntervals.push([startLetter, endLetter]);
            break;
        }else 
        if (filteredArray[i].toLowerCase().includes("seria") && i !== 0) {
            serie = await extractSeries(filteredArray[i]);
            series.push(serie);
            if (seriesStartIndex !== null) {
                const startLetter = await getColumnLetter(seriesStartIndex);
                const endLetter = await getColumnLetter(i);
                seriesIntervals.push([startLetter, endLetter]);
            }
            seriesStartIndex = i + 1;          
        }
    }
    const combinedArray = series.map((value, index) => {
        return {"serie": value, "interval": seriesIntervals[index]};
    });
    return combinedArray;
}
async function extractSeries(input) {
    // Regular expression to match the series letter after "Seria " and before any optional characters
    const regex = /Seria\s+(\w+)\s*-?\s*\w*\s*-?\s*\w*$/;

    // Match the series letter using the regular expression
    const match = input.match(regex);

    // Extract the series letter from the matched group
    if (match && match[1]) {
        return match[1];
    } else {
        // Return null if the series letter is not found
        return null;
    }
}

async function getSheetColumnsAndLinesNumberForMultipleSheets(auth, spreadSheetId, sheetNames) {
    const sheets = google.sheets({ version: "v4", auth: auth });
    try {
        const response = await sheets.spreadsheets.get({
            spreadsheetId: spreadSheetId
        });

        const results = sheetNames.map(sheetName => {
            const sheet = response.data.sheets.find(sheet => sheet.properties.title === sheetName);
            if (!sheet) {
                throw new Error(`Sheet '${sheetName}' not found.`);
            }

            const properties = sheet.properties;
            const rowCount = properties.gridProperties.rowCount;
            const columnCount = properties.gridProperties.columnCount;
            return { sheetName, rowCount, columnCount };
        });

        return results;
    } catch (err) {
        console.error('The API returned an error:', err);
        return sheetNames.map(sheetName => ({ sheetName, rowCount: 0, columnCount: 0 }));
    }
}

async function searchValuesInAllSheets(auth, sala, columnsCounts, seriesRanges) {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1LzBgIlGlCowjvNuh7BuBYDGagXa8XHwzs_PAYWxcQWY';
    const targetSheets = ['AN 1', 'AN 2', 'AN 3', 'AN 4'];
    const daysOfWeek = ['luni', 'marti', 'miercuri', 'joi', 'vineri'];

    let orarSala = {
        nume: `Orar sala ${sala}`,
        program: {
            luni: [],
            marti: [],
            miercuri: [],
            joi: [],
            vineri: []
        }
    };

    // Cache for day ranges
    const dayRangesCache = {};

    // Fetch day ranges for all sheets and cache them
    const fetchDayRanges = async () => {
        for (const sheet of targetSheets) {
            const an = sheet.split(' ')[1];
            const columnCount = columnsCounts[parseInt(an) - 1];
            if (!dayRangesCache[an]) {
                dayRangesCache[an] = await getDayRanges(auth, spreadsheetId, an, columnCount);
            }
        }
    };

    await fetchDayRanges();

    const getDataForSheet = async (sheet, day) => {
        const an = sheet.split(' ')[1];
        const columnCount = columnsCounts[parseInt(an) - 1];
        const serieRange = seriesRanges[parseInt(an) - 1];
        const dayRange = dayRangesCache[an][day];

        if (dayRange) {
            const [startRow, endRow] = dayRange;
            const sheetRange = `${sheet}!B${startRow}:${serieRange.end}${endRow}`;
            return sheets.spreadsheets.values.batchGet({
                spreadsheetId,
                ranges: [sheetRange],
            }).then(response => {
                const rows = response.data.valueRanges[0].values;
                if (rows) {
                    return rows.flatMap((row, rowIndex) => {
                        return row.map((cell, colIndex) => {
                            if (cell.includes(sala)) {
                                for (let leftIndex = colIndex - 1; leftIndex >= 0; leftIndex--) {
                                    if (row[leftIndex] && (row[leftIndex].includes('curs') || row[leftIndex].includes('lecture'))) {
                                        const ora = row[0];
                                        return {
                                            ora: extendTimeRange(ora, 1),
                                            materie: row[leftIndex].replace(/\n/g, ' '),
                                            zi: day
                                        };
                                    }
                                }
                            }
                            return null;
                        }).filter(item => item !== null);
                    });
                }
                return [];
            });
        } else {
            console.log(`Day range not found for day '${day}' in sheet '${sheet}'.`);
            return [];
        }
    };

    const allDataPromises = [];
    for (const sheet of targetSheets) {
        for (const day of daysOfWeek) {
            allDataPromises.push((async () => {
                await delay(50); // Delay to prevent rate limit
                return getDataForSheet(sheet, day);
            })());
        }
    }

    const allData = await Promise.all(allDataPromises);
    const ore = allData.flat();

    ore.forEach(item => {
        orarSala.program[item.zi].push(item);
    });

    const uniqueOrarSala = removeDuplicates(orarSala);

    Object.keys(uniqueOrarSala.program).forEach(day => {
        uniqueOrarSala.program[day].sort((a, b) => {
            const getStartHour = (timeRange) => parseInt(timeRange.split('-')[0], 10);
            return getStartHour(a.ora) - getStartHour(b.ora);
        });
    });

    return uniqueOrarSala;
}


async function getDayRanges(auth, spreadSheetId, an, columnCount) {
    const sheets = google.sheets({ version: "v4", auth: auth });
    const sheetName = "AN " + an;
    const range = sheetName + "!A1:A" + columnCount;
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: spreadSheetId,
        range: range
    });

    const values = response.data.values;
    const daysOfWeek = ['luni', 'marti', 'miercuri', 'joi', 'vineri']; // Adjust if necessary
    const dayRanges = {};

    for (const day of daysOfWeek) {
        for (let i = 0; i < values.length; i++) {
            if (values[i].length !== 0 && values[i][0].toLowerCase() === day) {
                dayRanges[day] = [i + 1, i + 13];
                break; // Stop after finding the first occurrence
            }
        }

        if (!dayRanges[day]) {
            console.log(`Day '${day}' not found in the spreadsheet.`);
        }
    }

    return dayRanges;
}
async function getSeriesRange(auth, spreadSheetId, ani) {
    const sheets = google.sheets({ version: "v4", auth: auth });
    let intervalePerSheet = [];
    for (const an of ani) {
        const sheetName = an;
        const range = sheetName + "!B1:1"; // Assuming the series are in the first row
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId: spreadSheetId,
            range: range
        });
        const values = response.data.values[0];     
        const intervals = await getSeriesIntervals(values);
        const pereche = {start: intervals[0].interval[0],
            end: intervals[intervals.length-1].interval[1]
        };
        intervalePerSheet.push(pereche);
    }

    return intervalePerSheet;

}

//connect to the database
mongoose.connect(process.env.MONG_URI)
.then(() => {
    app.listen(process.env.PORT, (req, res) => console.log("running on port 1337"));
})
.catch((error) => {
    console.log(error);
});
app.post("/api/user/register", async (req, res) => {
    const { email, firstName, lastName, username, password } = req.body;

    try {
        const userExists = await User.findOne({ $or: [{ email }, { username }] });

        if (userExists) {
            return res.status(409).json({ error: "Username or email already exists" });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        const user = new User({
            email,
            firstName,
            lastName,
            username,
            password: hash,
        });

        await user.save();

        res.status(201).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Login user
app.post("/api/user/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {
            return res.status(401).json({ error: "Invalid username or password" });
        }

        const token = jwt.sign({ _id: user._id }, JWT_SECRET, { expiresIn: '3d' });

        res.status(200).json({ username, token });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


app.use('/api/user', userRoutes)
// Simulated user data
const users = [
  { username: "user1", password: "password1", email: "user1@gmail.com", firstName: "user1", lastName: "user" },
  { username: "user2", password: "password2", email: "user2@gmail.com", firstName: "user2", lastName: "user" },
];

app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  // Attempt to find user by username and password
  const user = users.find(
    (user) => user.username === username && user.password === password,
  );

  if (user) {
    res.json({ success: true });
  } else {
    res.status(401).json({ error: "Invalid username or password" });
  }
});

app.post("/api/register", (req, res) => {
    const { email, firstName, lastName, username, password } = req.body;
    // Attempt to find user by username and password
    const user = users.find(
        (user) => user.username === username || user.email === email,
    );
    if (user) {
      res.status(409).json({ error: "Username or email already exists" });
    } else {
        users.push({ username: username, password: password, email: email, firstName: firstName, lastName: lastName });
        res.json({ success: true });
    }
  });
function removeDiacritics(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}


app.get("/api/orar-grupa", async (req, res) => {
  const { an, serie, paritate, semigrupa, zi, grupa } = req.query;
  console.log("Received data:", { an, serie, paritate, semigrupa, zi, grupa });
  console.log("Rubbish semigrupa :" + semigrupa);
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const grupaCompleta = grupa + semigrupa; 
  const client = await auth.getClient();
  const spreadSheetId = "1LzBgIlGlCowjvNuh7BuBYDGagXa8XHwzs_PAYWxcQWY";
  const spreadSheetName = "AN " + an;
  const { rowCount, columnCount } = await getSheetColumnsAndLinesNumber(
    client,
    spreadSheetId,
    spreadSheetName,
  );
  const anAsInt = parseInt(an);
  let orarGrupaSelectata = await getDailyScheduleOfGroup(
    client,
    spreadSheetId,
    anAsInt,
    zi,
    columnCount,
    grupaCompleta,
    serie,
    paritate,
  );
  let objToString = removeDiacritics(JSON.stringify(orarGrupaSelectata));
  console.log("String wihtout diactrics: " + objToString);
  let objWithoutDiacritics = JSON.parse(objToString);
  res.send(objWithoutDiacritics);
});

app.get("/api/orar-profesor", async (req, res) => {
    console.log('Am intrat in prof endpoint');
    const { profesor } = req.query;
    console.log("Profesor is " + profesor);
    const auth = new google.auth.GoogleAuth({
      keyFile: "credentials.json",
      scopes: "https://www.googleapis.com/auth/spreadsheets"
    });
      const client = await auth.getClient();
      const sheetsNames = ['AN 1', 'AN 2', 'AN 3', 'AN 4'];
      const spreadSheetId = "1LzBgIlGlCowjvNuh7BuBYDGagXa8XHwzs_PAYWxcQWY";
  
      try {
          // Fetch columns and rows count for all sheets in parallel
          const sheetColumnsAndLines = await getSheetColumnsAndLinesNumberForMultipleSheets(client, spreadSheetId, sheetsNames);
  
          // Extract column counts
          const columnsCounts = sheetColumnsAndLines.map(sheet => sheet.columnCount);
  
          // Fetch series ranges (assuming getSeriesRange function exists)
          const seriesRange1 = await getSeriesRange(client, spreadSheetId, sheetsNames);
  
          // Use the searchValuesInAllSheets function to get the schedule for the entire week
          const profesorResult = await searchTeacherInAllSheets(client, profesor, columnsCounts, seriesRange1);
          let objToString = removeDiacritics(JSON.stringify(profesorResult));
          console.log("String wihtout diactrics: " + objToString);
          let objWithoutDiacritics = JSON.parse(objToString);
          res.send(objWithoutDiacritics);
  
  } catch (error) {
      console.error('Error occurred:', error);
      res.status(500).send('An error occurred while processing your request.');
  }
  });

app.get("/api/orar-sala", async (req, res) => {
  const { sala, zi } = req.query;
  console.log("Sala is " + sala);
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets"
  });
    const client = await auth.getClient();
    const sheetsNames = ['AN 1', 'AN 2', 'AN 3', 'AN 4'];
    const spreadSheetId = "1LzBgIlGlCowjvNuh7BuBYDGagXa8XHwzs_PAYWxcQWY";

    try {
        // Fetch columns and rows count for all sheets in parallel
        const sheetColumnsAndLines = await getSheetColumnsAndLinesNumberForMultipleSheets(client, spreadSheetId, sheetsNames);

        // Extract column counts
        const columnsCounts = sheetColumnsAndLines.map(sheet => sheet.columnCount);

        // Fetch series ranges (assuming getSeriesRange function exists)
        const seriesRange1 = await getSeriesRange(client, spreadSheetId, sheetsNames);

        // Use the searchValuesInAllSheets function to get the schedule for the entire week
        const salaResult = await searchValuesInAllSheets(client, sala, columnsCounts, seriesRange1);
        let objToString = removeDiacritics(JSON.stringify(salaResult));
        let objWithoutDiacritics = JSON.parse(objToString);
        console.log("String wihtout diactrics: " + objToString);
        res.send(objWithoutDiacritics);

} catch (error) {
    console.error('Error occurred:', error);
    res.status(500).send('An error occurred while processing your request.');
}
});


function removeDuplicates(schedule) {
const uniqueItems = new Set();
const uniqueSchedule = {};

Object.keys(schedule.program).forEach(day => {
    uniqueSchedule[day] = [];
    schedule.program[day].forEach(item => {
        const itemString = JSON.stringify(item);
        if (!uniqueItems.has(itemString)) {
            uniqueItems.add(itemString);
            uniqueSchedule[day].push(item);
        }
    });
});

return {
    nume: schedule.nume,
    program: uniqueSchedule
};
}

  function findSubject(professorName, data) {
    // Împarte datele inițiale în segmente individuale pe baza delimitatorilor
    const segments = data.split(/[\|\|\/]/);

    // Iterează prin fiecare segment
    for (let segment of segments) {
        // Verifică dacă segmentul conține numele profesorului
        if (segment.includes(professorName)) {
            // Extrage și returnează materia folosind o expresie regulată
            const match = segment.match(/([\w\s]+)\s*\(curs\)/);
            if (match) {
                return match[1].trim();
            }
        }
    }

    // Dacă profesorul nu a fost găsit, returnează un mesaj corespunzător
    return 'Profesorul nu a fost găsit.';
}

async function searchTeacherInAllSheets(auth, teacher, columnsCounts, seriesRanges) {
    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = '1LzBgIlGlCowjvNuh7BuBYDGagXa8XHwzs_PAYWxcQWY';
    const targetSheets = ['AN 1', 'AN 2', 'AN 3', 'AN 4'];
    const daysOfWeek = ['luni', 'marti', 'miercuri', 'joi', 'vineri'];

    let orarProfesor = {
        nume: `Orar profesor ${teacher}`,
        program: {
            luni: [],
            marti: [],
            miercuri: [],
            joi: [],
            vineri: []
        }
    };

    // Cache for day ranges
    const dayRangesCache = {};

    // Fetch day ranges for all sheets and cache them
    const fetchDayRanges = async () => {
        for (const sheet of targetSheets) {
            const an = sheet.split(' ')[1];
            const columnCount = columnsCounts[parseInt(an) - 1];
            if (!dayRangesCache[an]) {
                dayRangesCache[an] = await getDayRanges(auth, spreadsheetId, an, columnCount);
            }
        }
    };

    await fetchDayRanges();

    const getDataForSheet = async (sheet, day) => {
        const an = sheet.split(' ')[1];
        const columnCount = columnsCounts[parseInt(an) - 1];
        const serieRange = seriesRanges[parseInt(an) - 1];
        const dayRange = dayRangesCache[an][day];

        if (dayRange) {
            const [startRow, endRow] = dayRange;
            const sheetRange = `${sheet}!B${startRow}:${serieRange.end}${endRow}`;
            return sheets.spreadsheets.values.batchGet({
                spreadsheetId,
                ranges: [sheetRange],
            }).then(response => {
                const rows = response.data.valueRanges[0].values;
                if (rows) {
                    return rows.flatMap((row, rowIndex) => {
                        return row.map((cell, colIndex) => {
                            if (cell.includes(teacher)) {
                                const ora = row[0];
                                const materie = findSubject(teacher, cell);
                                let sala = '';

                                // Search right for the first non-null cell
                                for (let i = colIndex + 1; i < row.length; i++) {
                                    if (row[i]) {
                                        sala = row[i];
                                        break;
                                    }
                                }

                                return {
                                    anulSiSeria: an,
                                    materie: materie,
                                    zi: day,
                                    ora: extendTimeRange(ora, 1),
                                    sala: sala
                                };
                            }
                            return null;
                        }).filter(item => item !== null);
                    });
                }
                return [];
            });
        } else {
            console.log(`Day range not found for day '${day}' in sheet '${sheet}'.`);
            return [];
        }
    };

    const allDataPromises = [];
    for (const sheet of targetSheets) {
        for (const day of daysOfWeek) {
            allDataPromises.push((async () => {
                await delay(50); // Delay to prevent rate limit
                return getDataForSheet(sheet, day);
            })());
        }
    }

    const allData = await Promise.all(allDataPromises);
    const ore = allData.flat();

    ore.forEach(item => {
        orarProfesor.program[item.zi].push(item);
    });

    const uniqueOrarProfesor = removeDuplicates(orarProfesor);

    Object.keys(uniqueOrarProfesor.program).forEach(day => {
        uniqueOrarProfesor.program[day].sort((a, b) => {
            const getStartHour = (timeRange) => parseInt(timeRange.split('-')[0], 10);
            return getStartHour(a.ora) - getStartHour(b.ora);
        });
    });

    return uniqueOrarProfesor;
}

