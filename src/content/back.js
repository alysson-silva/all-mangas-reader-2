/**
 * DEPRECATED
 * This code is part of the old version of the reader inherited from V1
 * It still contains code using jQuery or importing code using jQuery
 * The new reader can be found in the reader folder and is full VueJS
 * 
 * This code is kept for debugging reasons and "just in case"
 * It will be removed from V2.5
 */

/**
 * All Mangas Reader V2
 * Content script included in every website matching a manga site
 */
import browser from "webextension-polyfill";
import reading from './reading';
import navigation from './navigation';
import mirrorImpl from './mirrorimpl';
import pageData from './pagedata';
import util from './util';
import options from './options';
import HandleKeys from './handlekeys';

if (window["__backamr__"] === undefined) { // avoid loading script twice
    window["__backamr__"] = {}

    /**
     * Every mirror implementation ends by a call to registerMangaObject
     * This function is defined here.
     * This script is injected by background script if the page could be a manga page. 
     * Once loaded, the mirror implementation is called and results in this function call
     */
    window["registerMangaObject"] = async function (object) {
        util.debug("Mirror implementation " + object.mirrorName + " loaded in page.");
        // initialize Mirror Implementation
        mirrorImpl.load(object);

        // initialize options
        options.load(await browser.runtime.sendMessage({action: "getoptions"}));

        // Initialize the page once the mirror implementation has been loaded
        // Test if current page is a chapter page (according to mirror implementation)
        if (!mirrorImpl.get().isCurrentPageAChapterPage(document, window.location.href)) {
            util.debug("Current page is not recognize as a chapter page by mirror implementation");
            return;
        }
        // Retrieve informations relative to current chapter / manga read
        let data = await mirrorImpl.get().getInformationsFromCurrentPage(document, window.location.href)
        util.debug("Informations for current page loaded : ");
        util.debug(data);
        // Initialize pageData state
        pageData.load(data);

        let imagesUrl = [];
        if (options.displayChapters == 1) { // if display book
            // retrieve images to load (before doSomethingBeforeWritingScans because it can harm the source of data)
            imagesUrl = await mirrorImpl.get().getListImages(document, window.location.href);
            util.debug(imagesUrl.length + " images to load");
        }
        // some mirrors need to do something before the page is transformed
        mirrorImpl.get().doSomethingBeforeWritingScans(document, window.location.href);

        // create AMR navigation bar
        navigation.createNavBar();
        // tranform the page to a book
        reading.createBook(imagesUrl);

        // mark manga as read
        if (options.markwhendownload === 0) {
            reading.consultManga();
        }

        // Initialize key handling
        if (options.displayChapters == 1) { // if display book
            HandleKeys.init();
        }

        // TODO stats perso --> v2.0.3
    }

    /**
     * This function is called when an abstraction is loaded
     */
    window["registerAbstractImplementation"] = function (mirrorName) {
        // do nothing there, the abstract object is loaded on the window and referenced by its name
    }

    /** Function called through executeScript when context menu button invoked */
    window["clickOnBM"] = function(src) {
        let imgScan = util.getScan(src);
        if (!imgScan) return;

        pageData.curbookmark.type = "scan";
        pageData.curbookmark.scanUrl = imgScan.data("urlToLoad");
        pageData.curbookmark.scanName = imgScan.data("idScan");

        if (imgScan.data("note") !== undefined) {
            $("#noteAMR").val(imgScan.data("note"));
        } else {
            $("#noteAMR").val("");
        }
        if (imgScan.data("booked") === 1) {
            $("#delBtnAMR").show();
        } else {
            $("#delBtnAMR").hide();
        }

        navigation.showDialog();

    }
}
