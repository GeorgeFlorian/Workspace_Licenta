//get next column of the spreadsheet
function nextColumn(column) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const base = alphabet.length;
    const chars = column.split('');

    for (let i = chars.length - 1; i >= 0; i--) {
        let charIndex = alphabet.indexOf(chars[i]);
        charIndex++;
        if (charIndex >= base) {
            chars[i] = alphabet[charIndex % base]; 
        } else {
            chars[i] = alphabet[charIndex]; 
            break; 
        }
        if (i === 0) {
            chars.unshift('A');
        }
    }

    return chars.join('');
}

function mergeAndSortArrays(array1, array2) {
    const mergedArray = array1.concat(array2);
    mergedArray.sort((a, b) => {
        const startHourA = parseInt(a.ora.split('-')[0]);
        const startHourB = parseInt(b.ora.split('-')[0]);

        return startHourA - startHourB;
    });
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
        if (materieOra.length === 0 || materieOra[0].includes("curs")  || materieOra[0].includes("lecture") || regexGrupa.test(materieOra)) continue;
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
                materie = saptamana === 'impara' ? randuriElement[0].split('/')[0].trim() : randuriElement[0].split('/')[1].trim();
            }else if(randuriElement[0].slice(-1) !== '/'){
                materie = saptamana === 'impara' ? randuriElement[0].split('/')[0].trim() : randuriElement[0].split('/')[1].trim();
                sala = saptamana === 'impara' ? randuriElement[1].split('/')[0].trim() : randuriElement[1].split('/')[1].trim();
            }else {
                const newText = saptamana === 'impara' ? randuriElement[0].replace('/', '').trim() : randuriElement[1].replace('/', '').trim();
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
            materie = saptamana === 'impara' ? semigrupa.substring(0, indexSlash).trim() : semigrupa.substring(indexSlash+1).trim();
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
                    } else if(splitNewLines[1][0] === '/' && saptamana === 'impara') {
                        let profIndex = splitNewLines[0].toLowerCase().indexOf('prof.');
                        if(profIndex !== -1){
                            materie = splitNewLines[0].substring(0, profIndex).trim();
                            profesor = splitNewLines[0].substring(profIndex + 6).replace('/', '').trim();
                        }else{
                            materie = splitNewLines[0].replace('/', '').trim();
                        }
                    } else if(splitNewLines[1][0] === '/' && saptamana === 'para') {                
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
                        materie = saptamana === 'impara' ? splitNewLines[0].substring(0, delimiterIndexLine1).trim() : splitNewLines[0].substring(delimiterIndexLine1 + 1).trim();
                        profesor = saptamana === 'impara' ? splitNewLines[1].substring(6, delimiterIndexLine2).trim() : splitNewLines[1].substring(delimiterIndexLine2 + 7).trim();
                    }
                // element has only one line    
                } else if(element.includes('/')){
                    const splitLine = element.split('/');
                    let newText = saptamana === 'impara' ? splitLine[0] : splitLine[1];
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
    const regex = /Seria\s+(\w+)\s*-?\s*\w*\s*-?\s*\w*$/;
    const match = input.match(regex);
    if (match && match[1]) {
        return match[1];
    } else {
        return null;
    }
}

const threeHoursLabs = ["AMP", "CCP", "DE", "IEM", "TAPDS", "DOE", "G3D", "SECR", "RC", "TIVM", "BTM", "TPSVLSI", "3DG", "CA"]; 
const fourHoursLabs = ["PBD", "EIM", "CAD", "RS", "MEI", "MI", "IM"]; 

module.exports = {
    nextColumn,
    mergeAndSortArrays,
    getColumnArray,
    parseLabs,
    parseCursuri,
    extendTimeRange,
    mergeOrarEntries,
    extractSeries,
    getSeriesIntervals,
    getColumnLetter,
    threeHoursLabs,
    fourHoursLabs,
};