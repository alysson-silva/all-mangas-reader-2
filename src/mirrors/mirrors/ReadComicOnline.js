if (typeof registerMangaObject === 'function') {
	registerMangaObject({
        mirrorName: "Read Comic Online",
        canListFullMangas: true,
        mirrorIcon: "readcomiconline.webp",
        languages: "en",
        domains: ["readcomiconline.to"],
        home: "https://readcomiconline.to",
        chapter_url: /Issue-.*id=/g,
        
        getMangaList: async function (search) {
            let doc = await amr.loadPage(this.home + '/Search/Comic', { 
                nocache: true, 
                preventimages: true,
                post: true,
                data: {
                    keyword: search
                }
            })
            let res = []
            let self = this
            $('table.listing a', doc).each(function (index) {
                if ($(this).attr('href').includes('/Comic/')) {
                    res.push([$(this).text().trim(), self.home + $(this).attr('href')])
                }
            })
            console.log('Search Results')
            console.log(res)
            return res
        },
    
        getListChaps: async function (urlManga) {
            let doc = await amr.loadPage(urlManga, { nocache: true, preventimages: true })
            let res = []
            let self = this
            let comicName = $('a.bigChar', doc).text().trim()
            $("table.listing a", doc).each(function (index) {
                if ($(this).attr('href').includes('/Comic/')) {
                    res.push([$(this).text().replace(comicName, '').trim(), self.home + $(this).attr('href')])
                }
            })
            console.log('Chapter List')
            console.log(res)
            return res
        },
    
        getInformationsFromCurrentPage: async function (doc, curUrl) {
            let comicUrl = $('#navsubbar a', doc)
            let nameParts = comicUrl.text().split('\n')
            let name = ''
            nameParts.forEach(part => {
                if (!(part.trim() == '' || part.trim() == 'Comic' || part.trim() == 'information')) {
                    name += part + ' '
                }
            })

            let url = new URL(curUrl)
            let newUrl = url.origin + url.pathname + '?id=' + url.searchParams.get('id')
            return {
                "name": name.trim(),
                "currentMangaURL": this.home + comicUrl.attr('href'),
                "currentChapterURL": newUrl
            }
        },

        getListImages: async function (doc, curUrl) {
            doc = await amr.loadPage(curUrl + '&readType=1&quality=hq', { nocache: true })
            let regex = /lstImages\.push\(\"(.*?)\"\);/g
            let parts = doc.innerText.match(regex)
            var res = []
            parts.forEach(str => {
                res.push(str.replace('lstImages.push("', '').replace('");', ''))
            })
            return res
        },
    
        getImageFromPageAndWrite: async function (urlImg, image) {
            $(image).attr('src', urlImg)
        },

        isCurrentPageAChapterPage: function (doc, curUrl) {
            return $('#divImage img', doc).length > 0
        }
    })
}
