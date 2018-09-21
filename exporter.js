const fs = require('fs-extra');
const fetch = require('node-fetch');
const path = require(`path`);

const templates = require('./templates.js');

const exportPosts = (posts, rootPath, args) => {
    if (!rootPath.endsWith('/')) {
        rootPath = rootPath + '/'
    }

    posts.forEach(async post => {
        let slug = undefined;
        if (args.c) { // Try for permalinks
            if (post.custom_permalink) { //Indeed there is a permalink
                const lastChar = post.custom_permalink.charAt(post.custom_permalink.length - 1);
                if (lastChar == "/")
                    slug = post.custom_permalink.slice(0, post.custom_permalink.length - 2);
                else
                    slug = post.custom_permalink;
            }
        }

        if (slug === undefined)
            slug = post.slug;

        const postPath = `${__dirname}/${rootPath}${slug}.md`;

        const lastSep = postPath.lastIndexOf(path.sep);
        const folderStructure = postPath.slice(0, lastSep);
        const mediaPath = `${folderStructure}/media`;
        await fs.ensureDir(folderStructure);
        await fs.ensureDir(mediaPath);

        post.images.forEach(async image => {
            try {
                const imageResponse = await fetch(image.url);
                const writeStream = fs.createWriteStream(`${mediaPath}/${image.fileName}`);
                imageResponse.body.pipe(writeStream);
                await streamAsync(writeStream)
            } catch (error) {
                console.error("EXPORTER", error);
            }
        })

        post.title = post.title.replace(/"/g, "\\\"");// escape quotes
        const {title, date, passthroughUrl, markdownContent} = post;
        console.log("EXPORTER", post);
        const fileContents = templates.post(title, date.toISOString(), passthroughUrl, markdownContent);
        await fs.outputFile(`${postPath}`, fileContents);
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

module.exports = {exportPosts: exportPosts}
