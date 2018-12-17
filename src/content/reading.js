/**
 * DEPRECATED
 * This code is part of the old version of the reader inherited from V1
 * It still contains code using jQuery or importing code using jQuery
 * The new reader can be found in the reader folder and is full VueJS
 * 
 * This code is kept for debugging reasons and "just in case"
 * It will be removed from V2.5
 */

import browser from "webextension-polyfill";
import options from './options';
import mirrorImpl from './mirrorimpl'
import pageData from './pagedata'
import util from './util';
import i18n from '../amr/i18n';
import mirrorHelper from '../amr/mirrors-helper';

class Reading {
    async consultManga() {
        if (options.addauto !== 1) { // check if option "Automatically add manga to list" is unchecked
            // check if manga is already in list
            let exists = await browser.runtime.sendMessage({
                action: "mangaExists", 
                url: pageData.currentMangaURL,
                mirror: mirrorImpl.get().mirrorName,
                language: pageData.language
            })
            // if not, we do not add the manga to the list (else, we continue, so reading progress is updated)
            if (!exists) return;
        }
        browser.runtime.sendMessage({
            action: "readManga",
            url: pageData.currentMangaURL,
            mirror: mirrorImpl.get().mirrorName,
            lastChapterReadName: pageData.currentChapter,
            lastChapterReadURL: pageData.currentChapterURL,
            name: pageData.name,
            language: pageData.language
        });
    }

    async createBook(imagesUrl) {
        if (options.displayChapters == 1) { // display as a book
            let where = await mirrorImpl.get().whereDoIWriteScans(document, window.location.href);
            pageData.whereScans = where;
            //Get specific mode for currentManga
            let curmode = -1;
            let specific = await browser.runtime.sendMessage({ 
                action: "mangaInfos", 
                url: pageData.currentMangaURL, 
                language: pageData.language 
            });
            if (specific && specific.display) {
                curmode = specific.display;
            }
            //If not use default options mode
            if (curmode == -1) {
                curmode = options.displayMode;
            }
            imagesUrl = imagesUrl.map(url => {
                if (url.indexOf("//") === 0) {
                    return location.protocol + url;
                }
                return url;
            });
            this.writeImages(where, imagesUrl, curmode);
        }
    }

    writeImages(where, list, mode) {
        let table = $("<table class='AMRtable'></table>");
        table.css("text-align", "center");
        table.css("position", "static");
        table.css("width", "100%");
        table.appendTo(where);

        for (let i = 0; i < list.length; i++) {
            let tr = $("<tr></tr>");
            tr.appendTo(table);
            let td = $("<td></td>");
            td.css("text-align", "center");
            td.appendTo(tr);

            let spanner = $("<a class='spanForImg' href='" + list[i] + "'></div>");
            $(spanner).css("vertical-align", "middle");
            $(spanner).css("text-align", "center");
            $(spanner).data("order", i);
            spanner.appendTo(td);
            spanner.click((e) => e.preventDefault());

            let div = $("<div id='loader" + i + "' class='divLoading'></div>");
            div.css("background", "url(" + browser.extension.getURL("icons/loading.gif") + ") no-repeat center center");
            div.appendTo(spanner);

            // Using jQuery to create this image instead of DOM native method fix a
            //weird bug on canary and only some websites.
            //My thought is that a version of canary was mistaking the embedded jQuery
            //on the website and when the extension creates image from DOM and container
            //from website's jQuery. We can't have both of them interract (DOM restriction)
            //It might be a Canary issue more than an AMR issue... Here it is fixed...
            let img = new Image();

            $(img).addClass("imageAMR");
            $(img).data("owidth", img.offsetWidth);
            $(img).data("divLoad", "loader" + i);
            $(img).data("idScan", i);
            this.loadImageAMR(where, list[i], img, i, mode);
            $(img).appendTo(spanner);
        }

        let title = $("title").text();
        this.waitForImages(where, mode, title);
    }
    async onLoadImage(img) {
        $("#" + $(img).data("divLoad")).css("display", "none");
        $(img).data("finish", "1");
        $(img).css("margin-right", "10px");
        if ($(img).attr("src") != browser.extension.getURL("icons/imgerror.png")) {
            $(img).css("border", "5px solid white");
            $(img).css("margin-bottom", "50px");
        }

        //Create contextual menu to bookmark image
        let url = $(img).data("urlToLoad");
        if (url.indexOf("//") === 0) {
            url = location.protocol + url;
        }
        browser.runtime.sendMessage({
            action: "createContextMenu",
            lstUrls: [url]
        });
        //Check bookmarks
        let objBM = {
            action: "getBookmarkNote",
            mirror: mirrorImpl.get().mirrorName,
            url: pageData.currentMangaURL,
            chapUrl: pageData.currentChapterURL,
            type: "scan",
            scanUrl: $(img).data("urlToLoad"),
            scanName: $(img).data("idScan")
        };
        let result = await browser.runtime.sendMessage(objBM);
        if (result.isBooked) {
            $(img).data("note", result.note);
            $(img).data("booked", 1);
            if (result.note !== "") $(img).attr("title", "Note : " + result.note);
            $(img).css("border-color", "#999999");
        }
        if (options.autobm) {
            $(img).dblclick(function () {
                let obj;
                if ($(img).data("booked") === 1) {
                    obj = {
                        action: "deleteBookmark",
                        mirror: mirrorImpl.get().mirrorName,
                        url: pageData.currentMangaURL,
                        chapUrl: pageData.currentChapterURL,
                        type: "scan"
                    };
                    obj.scanUrl = $(img).data("urlToLoad");

                    $(img).css("border-top-color", "white");
                    $(img).css("border-right-color", "white");
                    $(img).css("border-bottom-color", "white");
                    $(img).css("border-left-color", "white");
                    $(img).removeAttr("title");
                    $(img).removeData("booked");
                    $(img).removeData("note");

                    browser.runtime.sendMessage(obj);
                } else {
                    obj = {
                        action: "addUpdateBookmark",
                        mirror: mirrorImpl.get().mirrorName,
                        url: pageData.currentMangaURL,
                        chapUrl: pageData.currentChapterURL,
                        type: "scan",
                        name: pageData.name,
                        chapName: pageData.currentChapter
                    };
                    obj.scanUrl = $(img).data("urlToLoad");
                    if (obj.scanUrl.indexOf("//") === 0) obj.scanUrl = location.protocol + obj.scanUrl;
                    obj.scanName = $(img).data("idScan");
                    obj.note = "";
                    
                    $(img).css("border-color", "#999999");
                    $(img).data("note", "");
                    $(img).data("booked", 1);

                    browser.runtime.sendMessage(obj);
                }
            });
        }
        let divNum = $("<div class='pagenumberAMR'><div class='number'>" + ($(img).data("idScan") + 1) + "</div></div>");
        divNum.appendTo($(img).closest(".spanForImg"));
    }

    onErrorImage(img) {
        let reading = this;
        $(img).css("margin-bottom", "50px");
        $(img).css("margin-right", "10px");
        if (img.naturalWidth === 0) {
            //Here, number of tries before considering image can not be loaded
            if ($(img).data("number") == 4) {
                console.error("Image has not been recovered");
                $(img).attr("src", browser.extension.getURL("icons/imgerror.png"));
                $(img).css("border", "0");
                $(img).css("margin", "0");
                $(img).data("finish", "1");
                $("#" + $(img).data("divLoad")).css("display", "none");

                //Create the reload button
                let butReco = $("<a class='buttonAMR'>" + i18n("content_read_reload") + "</a>");
                butReco.css("display", "block");
                butReco.css("max-width", "200px");
                butReco.css("margin-left", "auto");
                butReco.css("margin-right", "auto");
                $(img).after(butReco);
                butReco.click(async function () {
                    let imgAnc = $(this).prev();
                    let url = $(imgAnc).data("urlToLoad");
                    let divLoadId = $(imgAnc).data("divLoad");
                    let idScan = $(imgAnc).data("idScan");
                    let spanner = $(this).parent();
                    spanner.empty();

                    let nimg = new Image();
                    //== loadImage
                    $(nimg).data("urlToLoad", url);
                    $(nimg).css("border", "5px solid white");
                    $(nimg).on("load", () => reading.onLoadImage(nimg));
                    $(nimg).on("error", () => reading.onErrorImage(nimg));
                    (async () => await mirrorImpl.get().getImageFromPageAndWrite(util.removeProtocol(url), nimg))()

                    $(nimg).appendTo(spanner);

                    let div = $("<div id='" + divLoadId + "' class='divLoading'></div>");
                    div.css("background", "url(" + browser.extension.getURL("icons/loading.gif") + ") no-repeat center center");
                    $(nimg).data("divLoad", divLoadId);
                    $(nimg).data("idScan", idScan);
                    div.appendTo(spanner);
                });

            } else {
                util.debug("An image has encountered a problem while loading... All Mangas Reader is trying to recover it...");
                let imgSave = new Image();

                if ($(img).data("hasErrors") != "1") {
                    $(imgSave).data("hasErrors", "1");
                    $(imgSave).data("number", 1);
                } else {
                    $(imgSave).data("hasErrors", "1");
                    $(imgSave).data("number", $(img).data("number") + 1);
                }

                $(imgSave).data("divLoad", $(img).data("divLoad"));
                $(imgSave).data("idScan", $(img).data("idScan"));

                //== loadImage
                $(imgSave).data("urlToLoad", $(img).data("urlToLoad"));
                $(imgSave).css("border", "5px solid white");
                $(imgSave).addClass("imageAMR");
                $(imgSave).on("load", () => reading.onLoadImage(imgSave));
                $(imgSave).on("error", () => reading.onErrorImage(imgSave));
                (async () => await mirrorImpl.get().getImageFromPageAndWrite($(img).data("urlToLoad"), imgSave))()

                $(img).after($(imgSave));
                $(img).remove();
            }
        } else {
            $("#" + $(img).data("divLoad")).css("display", "none");
            $(img).data("finish", "1");
            $(img).data("error", "1");
        }
    }

    loadImageAMR(where, url, img, pos, mode, second) {
        if (!second) {
            $(img).data("urlToLoad", url);
            $(img).data("resize", options.resize);
            $(img).data("modedisplay", mode);

            $(img).on("load", () => this.onLoadImage(img));
            $(img).on("error", () => this.onErrorImage(img));
        }

        if (options.imgorder == 1) {
            if (this.nbLoaded(where) == pos) {
                (async () => await mirrorImpl.get().getImageFromPageAndWrite(util.removeProtocol(url), img))()
            } else {
                var _self = this;
                setTimeout(function () {
                    _self.loadImageAMR(where, url, img, pos, mode, true);
                }, 100);
            }
        } else {
            (async () => {
                await mirrorImpl.get().getImageFromPageAndWrite(util.removeProtocol(url), img)
            })()
        }
    }

    nbLoaded(where) {
        let nbOk = 0;
        $(".imageAMR", where).each(function (index) {
            if ($(this).data("finish") == "1") {
                nbOk++;
            }
        });
        return nbOk;
    }

    waitForImages(where, mode, title) {
        let isOk = true;
        let nbOk = 0;
        let nbTot = 0;
        $(".imageAMR", where).each(function (index) {
            if ($(this).data("finish") != "1") {
                isOk = false;
            } else {
                nbOk++;
            }
            if (this.offsetWidth != $(this).data("owidth")) {
                $("#" + $(this).data("divLoad")).css("display", "none");
            }
            nbTot++;
        });
        if (options.load == 1) {
            if (nbTot !== 0) {
                $("title").text(Math.floor(nbOk / nbTot * 100) + " % - " + title);
            }
        }
        if (isOk) {
            util.debug("finish loading images");
            this.transformImagesInBook(where, mode);
            mirrorImpl.get().doAfterMangaLoaded(document, window.location.href);
            $("title").text(title);
            if (pageData.nexturltoload && options.prefetch == 1) {
                this.loadNextChapter(pageData.nexturltoload);
            }
            if (options.markwhendownload === 1) {
                this.consultManga();
            }
        } else {
            let reading = this;
            setTimeout(function () {
                reading.waitForImages(where, mode, title);
            }, 500);
        }
    }

    isLandscape(img) {
        if ($(img).data("canvasId")) {
            let can = $("#" + $(img).data("canvasId"));
            return can.width() > can.height();
        } else {
            if (parseInt($(img).css("width"), 10) > parseInt($(img).css("height"), 10)) {
                return true;
            }
            return false;
        }
    }

    transformImagesInBook(where, mode) {
        //mode = 1 --> images are displayed on top of one another
        //mode = 2 --> images are displayed two by two occidental reading mode
        //mode = 3 --> images are displayed two by two japanese reading mode

        let nbSinglePages = 0;
        let posImg = [];
        let isFirstDouble = true;
        let isEven = true;
        let reading = this;

        util.debug("Transformation book -> Nombre d'images :" + $(".imageAMR", where).length);
        $(".imageAMR", where).sort(function (a, b) {
            let nba = $(a).closest(".spanForImg").data("order");
            let nbb = $(b).closest(".spanForImg").data("order");
            return ((nba < nbb) ? -1 : ((nba == nbb) ? 0 : 1));
        }).each(function (index) {
            //console.log("setting image position...");
            if (reading.isLandscape(this)) {
                posImg[index] = 2;
                if (reading.isLandscape(this) && isFirstDouble) {
                    if (index !== 0 && posImg[index - 1] != 1) {
                        for (let i = 0; i < posImg.length; i++) {
                            if (posImg[i] != 2) {
                                posImg[i] = (posImg[i] + 1) % 2;
                            }
                        }
                    }
                    isFirstDouble = false;
                }
                isEven = true;
            } else {
                if (index == $(".imageAMR", where).length - 1 && isEven) {
                    posImg[index] = 2;
                } else {
                    posImg[index] = isEven ? 0 : 1;
                    isEven = !isEven;
                }
            }
        });

        let parity = nbSinglePages % 2;
        let viewportWidthToUse = Math.max(document.documentElement.clientWidth, window.innerWidth || 0) - 200;
        
        $(where).css("text-align", "center");
        let evenImg = null;
        let tableRes = $("<table class='AMRtable'></table>");
        tableRes.css("width", "100%");
        tableRes.css("position", "static");

        $(".spanForImg", where).sort(function (a, b) {
            let nba = $(a).data("order");
            let nbb = $(b).data("order");
            return ((nba < nbb) ? -1 : ((nba == nbb) ? 0 : 1));
        }).each(function (index) {
            let divMode = ($("div > img", this).data("canvasId"));
            //console.log("displaying image position...");
            let td = $("<td></td>");

            if (!divMode) {
                if ($("img:first-child", this).attr("src") != browser.extension.getURL("icons/imgerror.png")) {
                    $("img:first-child", this).css("margin-bottom", "50px");
                    td.css("vertical-align", "middle");
                }
            }
            $(this).appendTo(td);

            //console.log("Displaying " + $("img:first-child", this).data("urlToLoad") + " in the table");
            let trTmp;
            if (posImg[index] == 2 || mode == 1) {
                if (evenImg !== null) {
                    let trForEven = $("<tr></tr>");
                    trForEven.appendTo(tableRes);
                    evenImg.appendTo(trForEven);
                    evenImg.attr("colspan", "2");
                    evenImg = null;
                    if (options.resize == 1) {
                        if (!divMode) $("img", trForEven).css("max-width", viewportWidthToUse + 'px');
                    }
                }
                trTmp = $("<tr></tr>");
                trTmp.appendTo(tableRes);
                td.attr("colspan", "2");
                td.appendTo(trTmp);
                if (options.resize == 1) {
                    if (!divMode) $("img", trTmp).css("max-width", viewportWidthToUse + 'px');
                }
            } else {
                if (evenImg !== null) {
                    trTmp = $("<tr></tr>");
                    trTmp.appendTo(tableRes);
                    if (mode == 2) {
                        evenImg.appendTo(trTmp);
                        evenImg.css("text-align", "right");
                        td.appendTo(trTmp);
                        td.css("text-align", "left");
                    } else {
                        td.appendTo(trTmp);
                        td.css("text-align", "right");
                        evenImg.appendTo(trTmp);
                        evenImg.css("text-align", "left");
                    }
                    if (options.resize == 1) {
                        if (!divMode) $("img", trTmp).css("max-width", (viewportWidthToUse / 2) + 'px');
                    }
                    evenImg = null;
                } else {
                    if (posImg[index] === 0) {
                        evenImg = td;
                    } else {
                        trTmp = $("<tr></tr>");
                        trTmp.appendTo(tableRes);
                        td.attr("colspan", "2");
                        td.appendTo(trTmp);
                        if (options.resize == 1) {
                            if (!divMode) $("img", trTmp).css("max-width", (viewportWidthToUse / 2) + 'px');
                        }
                    }
                }

            }
        });

        let divMode = ($("img:first-child", this).data("canvasId"));

        if (!divMode) {
            let td = $("<td></td>");
            $("img:first-child", this).css("margin-bottom", "50px");
            $("img:first-child", this).css("margin-right", "10px");
            $("img:first-child", this).appendTo(td);
        }
        if (evenImg !== null) {
            let trTmp = $("<tr></tr>");
            trTmp.appendTo(tableRes);
            if (mode == 2) {
                evenImg.appendTo(trTmp);
                evenImg.css("text-align", "right");
                td.appendTo(trTmp);
                td.css("text-align", "left");
            } else {
                td.appendTo(trTmp);
                td.css("text-align", "right");
                evenImg.appendTo(trTmp);
                evenImg.css("text-align", "left");
            }
            if (options.resize == 1) {
                if (!divMode) $("img", trTmp).css("max-width", (viewportWidthToUse / 2) + 'px');
            }
            evenImg = null;
        }

        $("table", where).remove();
        $(".amr-lastchap", where).remove();
        tableRes.appendTo(where);
        if ($("#nChapBtn0").length === 0) {
            $("<div style=\"width:100%; background-color:white; border-radius:5px;margin-top:15px;margin-bottom:15px;\" class='amr-lastchap'><img src=\"" + browser.extension.getURL("icons/warn.png") + "\" style=\"vertical-align:middle;margin-right:10px;\"/><span style=\"font-weight:bold;font-size:12pt;color:black;vertical-align:middle;\">" + i18n("content_nav_last_chap") + "</span></div>").appendTo(where);
        }
    }

    loadNextChapter(urlNext) {
        (async () => {
            util.debug("Loading next chapter...");
            // load an iframe with urlNext and get list of images
            let resp = await browser.runtime.sendMessage({
                action: "getNextChapterImages",
                url: urlNext,
                mirrorName: mirrorImpl.get().mirrorName, 
                language: pageData.language 
            });
            let lst = resp.images;
            if (lst !== null) {
                util.debug(lst.length + "... scans to load");
                for (let i = 0; i < lst.length; i++) {
                    let img = new Image();
                    $(img).data("attempts", 0);
                    $(img).data("id", i);
                    $(img).data("urltoload", lst[i]);
                    $(img).data("urlnext", urlNext);
                    $(img).data("total", lst.length);
                    $(img).on("load", () => this.onLoadNextImage());
                    $(img).on("error", () => this.onErrorNextImage());
                    (async () => await mirrorImpl.get().getImageFromPageAndWrite(lst[i], img))()
                }
            } else {
                util.debug("no scans found for next chapter...");
            }
        })()
    }

    onLoadNextImage() {
        let lstbtn = [];
        let id = "nChapBtn";
        let i = 0;
        while ($("#" + id + i).length > 0) {
            lstbtn[lstbtn.length] = $("#" + id + i);
            i++;
        }
        let _self = this;
        $.each(lstbtn, function (index) {
            if ($(this).data("nbloaded")) {
                $(this).data("nbloaded", $(this).data("nbloaded") + 1);
            } else {
                $(this).data("nbloaded", 1);
            }
            let prog;
            if ($(".AMRprogress", $(this)).length === 0) {
                prog = $("<span class='buttonAMR AMRprogress'></span>");
                prog.css("position", "relative");
                prog.css("top", "0");
                prog.css("left", "0");
                prog.css("width", "0px");
                prog.css("height", "4px");
                prog.css("border-radius", "2px");
                prog.css("border-radius", "2px");
                prog.css("background-color", "#8888EE");
                prog.css("opacity", "1");
                prog.css("display", "block");

                prog.appendTo($(this));
            } else {
                prog = $(".AMRprogress", $(this));
            }
            prog.css("width", (this[0].offsetWidth * ($(this).data("nbloaded") / $(_self).data("total"))) + "px");
        });
    }

    onErrorNextImage() {
        // do not retry... (will be retried 3 times when loaded for real)
    }
}
export default (new Reading);