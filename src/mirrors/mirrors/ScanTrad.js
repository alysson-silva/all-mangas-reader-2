if (typeof registerMangaObject === 'function') {
	registerMangaObject({
        mirrorName: "Scan Trad",
        canListFullMangas: true,
        mirrorIcon: "scantrad.png",
        languages: "fr",
        domains: ["scantrad.net"],
        home: "https://scantrad.net/",
        chapter_url: /^\/mangas\/.*\/[0-9]+.*$/g,

        getMangaList: async function (search) {
            let doc = await amr.loadPage("https://scantrad.net/mangas", { nocache: true, preventimages: true })
            let res = [];
            $('a.home-manga', doc).each(function (index) {
                res[index] = [$(".hmi-titre", $(this)).text(), "https://scantrad.net" + $(this).attr('href')];
            });
           return res;
        },
    
        getListChaps: async function (urlManga) {
            let doc = await amr.loadPage(urlManga, { nocache: true, preventimages: true })
            let res = [];
            $('.mf-chapitre .chapitre', doc).each(function () {
                let url = $(".chr-button:first", $(this)).attr("href")
                if (url.indexOf("/mangas") === 0) {
                    res[res.length] = [$(".chl-titre:first", $(this)).text().trim(), "https://scantrad.net" + url];
                }
            });
            return res;
        },
    
        getInformationsFromCurrentPage: async function (doc, curUrl) {
            var mg = $("#topLEL a.tl-titre", doc)
            let mangaLink = mg.attr('href')
            return {
                "name": mg.text(),
                "currentMangaURL": mangaLink.includes('https://scantrad.net') ? mangaLink : 'https://scantrad.net' + mangaLink,
                "currentChapterURL": "https://scantrad.net/" + $("#selectCh option:selected", doc).val()
            }
        },
    
        getListImages: async function (doc, curUrl) {
            let res = []
            $(".main_img img", doc).each(function() {
                let url = $(this).attr("data-src")
                if (!url) {
                    return
                }
                if (url.indexOf("http") !== 0) url = "https://scantrad.net/" + url
                res.push(url)
            })
            return res
        },
    
        getImageFromPageAndWrite: async function (urlImg, image) {
            $(image).attr("src", urlImg);
        },
    
        isCurrentPageAChapterPage: function (doc, curUrl) {
            return $(".main_img img", doc).length > 0;
        }
    })
}