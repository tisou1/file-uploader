import fg from 'fast-glob'

const entries = await fg("a/**",{ onlyFiles: false})

const entries2 = await fg("a/*")



console.log(entries)  //[ 'a/1.txt', 'a/b/2.txt' ]
console.log(entries2)  //[ 'a/1.txt']
