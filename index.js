const express = require("express");
const { google } = require("googleapis");
const app = express();

app.use(express.json());

const threeHoursLabs = [
  "AMP (l)",
  "CCP (l)",
  "DE (l)",
  "ASC (l)",
  "IEM (l)",
  "TAPDS (l)",
];

async function getSheetsNames(auth, spreadSheetId) {
  const sheets = google.sheets({ version: "v4", auth: auth });
  const response = await sheets.spreadsheets.get({
    spreadsheetId: spreadSheetId,
    fields: "sheets.properties.title",
  });
  return response.data.sheets.map((sheet) => sheet.properties.title);
}

async function getSheetColumnsAndLinesNumber(auth, spreadSheetId, sheetName) {
  const sheets = google.sheets({ version: "v4", auth: auth });
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: spreadSheetId,
    });

    const sheet = response.data.sheets.find(
      (sheet) => sheet.properties.title === sheetName,
    );
    if (!sheet) {
      throw new Error(`Sheet '${sheetName}' not found.`);
    }

    const properties = sheet.properties;
    const rowCount = properties.gridProperties.rowCount;
    const columnCount = properties.gridProperties.columnCount;
    console.log(
      "[DEBUG] RowCount:",
      rowCount,
      "; ColumnCount:",
      columnCount,
      "for sheet:",
      sheetName,
    );
    return { rowCount, columnCount };
  } catch (err) {
    console.error("The API returned an error:", err);
    return { rowCount: 0, columnCount: 0 };
  }
}

async function getDayRange(auth, spreadSheetId, an, zi, columnCount) {
  const sheets = google.sheets({ version: "v4", auth: auth });
  const sheetName = "AN " + an;
  const range = sheetName + "!A1:A" + columnCount;
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadSheetId,
    range: range,
  });
  const values = response.data.values;
  for (let i = 0; i < values.length; i++) {
    if (values[i].length !== 0) {
      if (values[i][0].toLowerCase() === zi) {
        return [i, i + 12];
      }
    }
  }
  console.log(`Day '${zi}' not found in the spreadsheet.`);
  return null;
}

//get next column of the spreadsheet
function nextColumn(column) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const base = alphabet.length;

  // Convert column label to array of characters
  const chars = column.split("");

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
      chars.unshift("A");
    }
  }

  return chars.join("");
}

async function getDailyScheduleOfGroup(
  auth,
  spreadSheetId,
  an,
  zi,
  columnCount,
  grupa,
  seria,
  saptamana,
) {
  let objectToReturn = {};
  const sheets = google.sheets({ version: "v4", auth: auth });

  const dayRange = await getDayRange(auth, spreadSheetId, an, zi, columnCount);
  const [verticalStart, verticalEnd] = dayRange;

  const serieRange = await getSeriesRanges(auth, spreadSheetId, an, seria);
  const [horizontalStart, horizontalEnd] = serieRange.interval;

  const sheetName = "AN " + an;

  const rangeGrupe = `${sheetName}!${horizontalStart}2:${horizontalEnd}2`;
  const grupeResponse = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadSheetId,
    range: rangeGrupe,
  });
  const grupeValues = grupeResponse.data.values[0];
  console.log("Grupe: " + grupeValues);
  let grupaColumnIndex = grupeValues.findIndex((value) => value === grupa);

  if (grupaColumnIndex === -1) {
    console.log(`Grupa '${grupa}' not found in the specified range.`);
    return `Grupa '${grupa}' not found in the specified range.`;
  }

  const columnArray = getColumnArray(horizontalStart, horizontalEnd);
  let range = `${sheetName}!${columnArray[grupaColumnIndex]}${verticalStart}:${columnArray[grupaColumnIndex]}${verticalEnd}`;
  if (grupa.endsWith("b"))
    range = `${sheetName}!${columnArray[grupaColumnIndex - 1]}${verticalStart}:${columnArray[grupaColumnIndex]}${verticalEnd}`;

  const groupSchedule = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadSheetId,
    range: range,
  });

  const rangeCursuri = `${sheetName}!${horizontalStart}${verticalStart}:${horizontalStart}${verticalEnd}`;
  const coursesSchedule = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadSheetId,
    range: rangeCursuri,
  });

  const values = groupSchedule.data.values;

  const valuesCursuri = coursesSchedule.data.values;

  if (zi !== "luni" && values !== undefined && valuesCursuri !== undefined) {
    values.shift();
    valuesCursuri.shift();
  } else if (zi !== "luni" && values !== undefined) {
    values.shift();
  } else if (zi !== "luni" && valuesCursuri !== undefined) {
    valuesCursuri.shift();
  }
  console.log("Values: {}", values);
  console.log("Values cursuri: {}", valuesCursuri);
  let intervaleLaboratoare = "";
  let intervaleCursuri = "";
  let intervaleMaterii = [];
  if (valuesCursuri !== undefined)
    intervaleCursuri = parseCursuri(valuesCursuri, saptamana);
  //console.log("Intervale cursuri: " + JSON.stringify(intervaleCursuri));
  if (values !== undefined) intervaleLaboratoare = parseLabs(values, saptamana);
  //console.log("Intervale labs: " + JSON.stringify(intervaleLaboratoare));
  if (values !== undefined && valuesCursuri !== undefined)
    intervaleMaterii = mergeAndSortArrays(
      intervaleCursuri,
      intervaleLaboratoare,
    );
  else if (values !== undefined) intervaleMaterii = intervaleLaboratoare;
  else if (valuesCursuri !== undefined) intervaleMaterii = intervaleCursuri;
  objectToReturn.numeOrar = `Orar anul '${an}' Seria '${seria}'.`;
  objectToReturn.zi = zi;
  objectToReturn.saptamana = saptamana;
  objectToReturn.grupa = grupa;
  if (intervaleMaterii.length !== 0)
    objectToReturn.orar = mergeOrarEntries(intervaleMaterii);
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
    const startHourA = parseInt(a.ora.split("-")[0]);
    const startHourB = parseInt(b.ora.split("-")[0]);

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

function parseLabs(values, saptamana) {
  const intervaleMaterii = [];
  const ore = [
    "08-09",
    "09-10",
    "10-11",
    "11-12",
    "12-13",
    "13-14",
    "14-15",
    "15-16",
    "16-17",
    "17-18",
    "18-19",
    "19-20",
    "20-21",
  ];

  for (let i = 0; i < values.length; i++) {
    const orarOra = values[i];
    console.log("Ora: " + orarOra);
    let splitNewLines = [];
    const newlineRegex = /[\r\n]+/;
    console.log("orarOra: " + typeof orarOra);
    if (orarOra.length !== 0 && !orarOra[0].includes("curs")) {
      let timeRange = threeHoursLabs.some((element) =>
        orarOra[0].includes(element),
      )
        ? extendTimeRange(ore[i], 2)
        : extendTimeRange(ore[i], 1);
      const checkSemigrupa = orarOra[0].split(",");
      const semigrupa =
        checkSemigrupa.length === 2 ? checkSemigrupa[1] : checkSemigrupa[0];
      console.log("Semigrupa" + semigrupa);
      let materie = "";
      let sala = "";
      const regexSala = /^[AB]\d{2,3}[ab]?$/;
      const regexSalaCalculatoare = /^S\d+\sCalc$|^S\d+\sCalc$|^S\d+\sCALC$/i;
      //check if element has 2 lines
      if (newlineRegex.test(semigrupa)) {
        let rows = semigrupa.split(/[\r\n]+/);
      } else if (semigrupa.includes("/")) {
        const indexSlash = semigrupa.indexOf("/");
        console.log("indexSlash: " + indexSlash);
        materie =
          saptamana === "impara"
            ? semigrupa.substring(0, indexSlash).trim()
            : semigrupa.substring(indexSlash + 1).trim();
      } else {
        const lastSpace = semigrupa.lastIndexOf(" ");
        const lastCharacters = semigrupa.substring(lastSpace + 1);
        console.log("Last characters: " + lastCharacters);
        if (
          regexSala.test(lastCharacters) ||
          regexSalaCalculatoare.test(lastCharacters)
        ) {
          sala = lastCharacters;
          materie = semigrupa.substring(0, lastSpace);
        } else {
          materie = semigrupa;
          sala = "--";
        }
      }
      if (materie.length !== 0 && materie !== "--")
        intervaleMaterii.push({
          ora: timeRange,
          materie: materie,
          sala: sala,
        });
    }
  }
  console.log("Intervale Laburi: " + intervaleMaterii);
  return intervaleMaterii;
}

function parseCursuri(valuesCursuri, saptamana) {
  const intervaleMaterii = [];
  const ore = [
    "08-09",
    "09-10",
    "10-11",
    "11-12",
    "12-13",
    "13-14",
    "14-15",
    "15-16",
    "16-17",
    "17-18",
    "18-19",
    "19-20",
    "20-21",
  ];

  for (let i = 1; i < valuesCursuri.length; i++) {
    if (valuesCursuri[i].length > 0) {
      let element = valuesCursuri[i][0];
      console.log("Element: " + element);
      if (
        element.includes("(c)") &&
        (element.includes("|") || element.toLowerCase().includes("opt"))
      ) {
        const timeRange = extendTimeRange(ore[i], 1);
        intervaleMaterii.push({ ora: timeRange, materie: element });
      } else if (element.includes("||")) {
        const timeRange = extendTimeRange(ore[i], 1);
        const newlineRegex = /[\r\n]+/;
        intervaleMaterii.push({
          ora: timeRange,
          materie: element.replace(newlineRegex, " "),
        });
      } else if (element.includes("curs")) {
        const newlineRegex = /[\r\n]+/;
        let materie = "";
        let profesor = "";
        //check if element has multiple lines
        if (newlineRegex.test(element)) {
          const splitNewLines = element.split(newlineRegex);
          //check if it contains only one subject
          if (!element.includes("/")) {
            materie = splitNewLines[0];
            profesor = splitNewLines[1].substring(6).trim();
            //check if every line contains only one subject
          } else if (
            splitNewLines[1].trim()[0] === "/" &&
            saptamana === "impara"
          ) {
            let profIndex = splitNewLines[0].toLowerCase().indexOf("prof.");
            if (profIndex !== -1) {
              materie = splitNewLines[0].substring(0, profIndex).trim();
              profesor = splitNewLines[0]
                .substring(profIndex + 6)
                .replace("/", "")
                .trim();
            }
          } else if (
            splitNewLines[1].trim()[0] === "/" &&
            saptamana === "para"
          ) {
            let profIndex = splitNewLines[1].toLowerCase().indexOf("prof.");
            if (profIndex !== -1) {
              materie = splitNewLines[1].substring(1, profIndex).trim();
              profesor = splitNewLines[1].substring(profIndex + 6).trim();
            }
          } else {
            const delimiterIndexLine1 = splitNewLines[0].indexOf("/");
            const delimiterIndexLine2 = splitNewLines[1].indexOf("/");
            materie =
              saptamana === "impara"
                ? splitNewLines[0].substring(0, delimiterIndexLine1).trim()
                : splitNewLines[0].substring(delimiterIndexLine1 + 1).trim();
            profesor =
              saptamana === "impara"
                ? splitNewLines[1].substring(6, delimiterIndexLine2).trim()
                : splitNewLines[1].substring(delimiterIndexLine2 + 7).trim();
          }
          // element has only one line
        } else if (element.includes("/")) {
          const splitLine = element.split("/");
          let newText = saptamana === "impara" ? splitLine[0] : splitLine[1];
          let profIndex = newText.toLowerCase().indexOf("prof.");
          if (profIndex !== -1) {
            materie = newText.substring(1, profIndex).trim();
            profesor = newText.substring(profIndex + 6).trim();
          }
        } else {
          let profIndex = element.toLowerCase().indexOf("prof.");
          materie = element.substring(0, profIndex).trim();
          profesor = element.substring(profIndex + 6).trim();
        }
        const timeRange = extendTimeRange(ore[i], 1);
        console.log("Profesor: " + profesor);
        console.log("Materie: " + materie);
        if (materie.length !== 0 && materie !== "--")
          intervaleMaterii.push({
            ora: timeRange,
            materie: materie,
            profesor: profesor,
          });
        console.log("Intervale materii: " + JSON.stringify(intervaleMaterii));
      }
    }
  }
  return intervaleMaterii;
}

function extendTimeRange(timeRange, amount) {
  const startTime = timeRange.split("-")[0];
  const endTime = (parseInt(timeRange.split("-")[1]) + amount)
    .toString()
    .padStart(2, "0");
  return `${startTime}-${endTime}`;
}

function mergeOrarEntries(orar) {
  const materieGroups = {};

  // Group objects by 'materie' field
  orar.forEach((entry) => {
    if (!materieGroups[entry.materie]) {
      materieGroups[entry.materie] = [];
    }
    materieGroups[entry.materie].push(entry);
  });

  // Merge entries within each group
  const mergedOrar = [];
  for (const materie in materieGroups) {
    const entries = materieGroups[materie];
    const startTime = Math.min(
      ...entries.map((entry) => parseInt(entry.ora.split("-")[0])),
    );
    const endTime = Math.max(
      ...entries.map((entry) => parseInt(entry.ora.split("-")[1])),
    );

    // Extract sala from the entries and remove duplicates
    const sala = entries.some((entry) => entry.sala)
      ? [...new Set(entries.map((entry) => entry.sala))]
          .filter(Boolean)
          .join("/")
      : undefined;
    const profesor = entries.some((entry) => entry.profesor)
      ? [...new Set(entries.map((entry) => entry.profesor))]
          .filter(Boolean)
          .join("/")
      : undefined;
    mergedOrar.push({
      ora: startTime + "-" + endTime,
      materie: materie,
      sala: sala,
      profesor: profesor,
    });
  }

  return mergedOrar;
}

async function getSeriesRanges(auth, spreadSheetId, an, serie) {
  const sheets = google.sheets({ version: "v4", auth: auth });
  const sheetName = "AN " + an;
  const range = sheetName + "!B1:1";
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: spreadSheetId,
    range: range,
  });
  const values = response.data.values[0];
  console.log("Values: " + values);
  const intervals = await getSeriesIntervals(values);
  console.log("Intervals:");
  intervals.forEach((interval) => {
    console.log(interval);
  });
  const serieInterval = intervals.find((item) => item.serie === serie);
  console.log("SERIE INTERVAL: " + serieInterval);
  return serieInterval;
}

app.get("/", async (req, res) => {
  const auth = new google.auth.GoogleAuth({
    keyFile: "credentials.json",
    scopes: "https://www.googleapis.com/auth/spreadsheets",
  });
  const client = await auth.getClient();
  const spreadSheetId = "1LzBgIlGlCowjvNuh7BuBYDGagXa8XHwzs_PAYWxcQWY";
  const { rowCount, columnCount } = await getSheetColumnsAndLinesNumber(
    client,
    spreadSheetId,
    "AN 1",
  );
  const orarSeriaALuni = await getDailyScheduleOfGroup(
    client,
    spreadSheetId,
    1,
    "miercuri",
    columnCount,
    "412Aa",
    "A",
    "para",
  );
  res.send(orarSeriaALuni);
});

async function getColumnLetter(index) {
  let column = "";
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
  let filteredArray = array.filter((element) => {
    return !element || element.toLowerCase().includes("seria");
  });
  for (let i = 0; i < filteredArray.length; i++) {
    if (i === filteredArray.length - 1) {
      const startLetter = await getColumnLetter(seriesStartIndex);
      const endLetter = await getColumnLetter(i + 1);
      seriesIntervals.push([startLetter, endLetter]);
      break;
    } else if (filteredArray[i].toLowerCase().includes("seria") && i !== 0) {
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
  console.log("Series extrasa din: {}", series);
  console.log("Series extrasa din: {}", seriesIntervals);
  const combinedArray = series.map((value, index) => {
    return { serie: value, interval: seriesIntervals[index] };
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

// async function getDailyScheduleOfASeries(auth, spreadSheetId, an, serie){
//     const sheets = google.sheets({ version: "v4", auth: auth});
//     const sheetName = "AN " + an;
//     const interval = await getSeriesRanges(auth, spreadSheetId, an, serie);
//     const range = sheetName + "!" + interval.start + ":" + interval.end;
//     const response = await sheets.spreadsheets.get({
//         spreadsheetId: spreadSheetId,
//         range: range
//     });
//     return response.data;
// }

// Dummy data
const data = { message: "Hello from Express!" };

// Route to get the dummy data
app.get("/api/data", (req, res) => {
  res.json(data);
});

// Simulated user data
const users = [
  { username: "user1", password: "password1" },
  { username: "user2", password: "password2" },
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

app.post("/api/orar-grupa", (req, res) => {
  const { an, serie, paritate, zi, grupa } = req.body;
  console.log("Received data:", { an, serie, paritate, zi, grupa });

  // Respond with a success message
  res.status(200).json({ message: "Data received successfully" });
});

app.listen(1337, (req, res) => console.log("running on port 1337"));
