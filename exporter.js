const fs = require('fs-extra')
const fetch = require('node-fetch')

const templates = require('./templates.js')

const exportPosts = (posts, rootPath) => {
    if (!rootPath.endsWith('/')) {
        rootPath = rootPath + '/'
    }

    posts.forEach(async post => {
        const postPath = `${__dirname}/${rootPath}${post.slug}`;
        console.log(rootPath)
        console.log(post.slug)
        console.log(post.link)
        
        return;
        await fs.ensureDir(postPath)

        post.images.forEach(async image => {
            try {
                const imageResponse = await fetch(image.url)
                const writeStream = fs.createWriteStream(`${postPath}/${image.fileName}`)
                imageResponse.body.pipe(writeStream)
                await streamAsync(writeStream)
            } catch (error) {
                console.error(error)
            }
        })

        post.title = post.title.replace(/"/g, "\\\"");// escape quotes
        const {title, date, passthroughUrl, markdownContent} = post;
        console.log("EXPORTER", post);
        const fileContents = templates.post(title,date.toISOString(), passthroughUrl, markdownContent);
        await fs.outputFile(`${postPath}/index.md`, fileContents)
    })
}

const streamAsync = (stream) => {
    return new Promise((resolve, reject) => {
        stream.on('end', () => {
            resolve('end');
        })
        stream.on('finish', () => {
            resolve('finish');
        })
        stream.on('error', (error) => {
            reject(error);
        })
    })
}

module.exports = { exportPosts: exportPosts }