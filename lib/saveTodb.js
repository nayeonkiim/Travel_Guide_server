const fs = require('fs')

const dataBuffer = fs.readFileSync('C:/Users/rlask/OneDrive/문서/Travel_Guide_server/lib/data.json')
const dataJSON = dataBuffer.toString();
const data = JSON.parse(dataJSON);

for (let i = 0; i < data.length; i++) {
    
}
console.log(data[0].관광지명);

//const read = JSON.