const feedRead = require('davefeedread')
const TurndownService = require('turndown')
const turndownService = new TurndownService({
    headingStyle: 'atx',
    codeBlockStyle: 'fenced'
})
const cheerio = require('cheerio')
const uuid = require('uuid/v4') // v4 generates random UUIDs
const url = require('url')
const path = require('path')

const importPosts = async (file) => {
    const feed = await parseFeed(file)

    // Filter for only blog posts
    var items = feed.items.filter((item, index) => item['wp:post_type']['#'] === 'post')

    // Map to new object type
    items = items.map(item => {
        const mappedItem = {
            'title': item.title,
            'date': item.date,
            'content': item['content:encoded']['#'],
            'categories': item.categories,
            'slug': item['wp:post_name']['#'],
            'link': item['link']
        }


        // all all metadata
        const postMeta = item['wp:postmeta']
        if (postMeta) {
           if(Array.isArray(postMeta)){
            postMeta.forEach(metaObj => {
                const metaName = metaObj['wp:meta_key']['#'];
                const metaValue = metaObj['wp:meta_value']['#'];
                mappedItem[metaName] = metaValue;
            });
           }else{
               if(postMeta['wp:meta_key']){
                const metaKey = postMeta['wp:meta_key']['#']
                if (metaKey == "passthrough_url") {
                    mappedItem.passthroughUrl = postMeta['wp:meta_value']['#']
                }
               }
           }
        }
        // Add images array
        const images = parseImages(mappedItem.content);
        const MEDIA = "media/";
        images.forEach(image => {
            mappedItem.content = mappedItem.content.replace(image.url, `${MEDIA}${image.fileName}`);
        })
        mappedItem.images = images;

        // Strip out Squarespace content tags
        mappedItem.content = removeSquarespaceCaptions(mappedItem.content);

        // Add Markdown conversion
        mappedItem.markdownContent = turndownService.turndown(mappedItem.content);

        return mappedItem
    })

    return items
}

const parseFeed = (file) => {
    return new Promise((resolve, reject) => {
        feedRead.parseString(file, undefined, (error, result) => {
            if (error) {
                reject(error)
            } else {
                resolve(result)
            }
        })
    })
}

const parseImages = (content) => {
    const postElements = cheerio.load(content)
    const imagesElements = postElements('img')
    const images = imagesElements.map((index, item) => {
        const imageName = uuid()
        const imageUrl = item.attribs['src']
        const imageExtension = path.extname(url.parse(imageUrl).pathname);
        return {
            url: imageUrl,
            fileName: `${imageName}${imageExtension}`
        }
    }).toArray()
    return images
}

const removeSquarespaceCaptions = (post) => {
    // remove the caption crap that gets put in by squarespace
    post = post.replace(/(\[caption.*"])(<.*>)(.*\[\/caption])/g, "$2")
    return post
}

module.exports = { importPosts: importPosts }
