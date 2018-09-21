const fs = require('fs-extra')
const args = require('minimist')(process.argv.slice(2))

const importer = require('./importer.js')
const exporter = require('./exporter.js')

const runner = async () => {
    if (args._.length < 2) {
        console.error('Expects at least input file as first parameter, and export directory as second.')
        process.exit()
    }

    const inputFilePath = args._[0];
    const outputDir = args._[1];

    const inputFile = fs.readFileSync(inputFilePath, 'utf8');
    let posts;
    try {
        posts = await importer.importPosts(inputFile);
    } catch (e){
        console.log("RUNNER", e);
        process.exit();
    }

    if (posts === undefined){
        console.log("RUNNER", "No info to export");
        process.exit();
    }

    try {
        await exporter.exportPosts(posts, outputDir, args)
    } catch (e){
        console.log("RUNNER", e);
    }
}


runner();
