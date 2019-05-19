import pageData from '../state/pagedata';
import bookmarks from '../state/bookmarks';
import { scansProvider, ScansLoader } from "./ScansProvider";
import mirrorImpl from '../state/mirrorimpl';
import browser from "webextension-polyfill";

/**
 * This class loads a chapter, retrieve informations, scans, and initialize or reinitialize the reader with all this data
 */
export default class ChapterLoader {
    constructor(url) {
        this.url = url
        this.isAChapter = false
        this.infos = null
        this.images = null
        this.title = null
        this.scansProvider = null
    }
    /**
     * Initialize the Chapter loading : 
     *  - if this.url is not null, load the chapter in background
     *  - check if it is a chapter page through implementation
     *  - get informations from page using implementation
     *  - get images from page
     * @param {*} url 
     */
    async checkAndLoadInfos() {
        let url = this.url
        if (!url) url = window.location.href

        let loadFromBack = false
        // test if implementation request to make the calls from background page, this is due to CORB in chrome 73, if CORS or set, request won't work from content script
        if (mirrorImpl.get().fromback && mirrorImpl.get().fromback.includes("infos")) {
            loadFromBack = true
        }

        if (this.url || loadFromBack) {
            let data = await browser.runtime.sendMessage({
                action: "getChapterData", 
                url: url,
                mirrorName: mirrorImpl.get().mirrorName, // assuming we read on the same mirror (no other possibilities for now...)
                language: pageData.state.language // and in the same language...
            })
            this.isAChapter = data.isChapter
            this.infos = data.infos
            this.images = data.images
            this.title = data.title
        } else {
            // retrieve infos from current page
            // Initialize the page once the mirror implementation has been loaded
            // Test if current page is a chapter page (according to mirror implementation)
            this.isAChapter = mirrorImpl.get().isCurrentPageAChapterPage(document, window.location.href)
            try {
                this.title = document.title
                // Retrieve informations relative to current chapter / manga read
                this.infos = await mirrorImpl.get().getInformationsFromCurrentPage(document, window.location.href)

                // retrieve images to load
                this.images = await mirrorImpl.get().getListImages(document, window.location.href)
            } catch (e) {
                console.error("Error while initializing AMR : ");
                console.error(e)
            }
        }
    }

    /** 
     * This method allows to pre load the scans without switching to this chapter in the current state 
     */
    loadScans() {
        console.log((this.url ? this.url : 'current page') + " --> " + this.images.length + " images to load in background");
        this.scansProvider = new ScansLoader(this.images)
        this.scansProvider.load() // pre load scans
        return this.scansProvider
    }

    /**
     * Once checkAndLoadInfos has been called, 
     * loadInReader switch the current state to this specific chapter to read
     */
    loadInReader(options) {
        if (this.isAChapter) {
            console.log("Informations for " + (this.url ? this.url : 'current page') + " loaded : ");
            console.log(this.infos);
            // Initialize pageData state
            pageData.load(this.infos);

            if (!this.images || this.images.length === 0) {
                // No images, chapter loading fails
                return false;
            }
            console.log((this.url ? this.url : 'current page') + " --> " + this.images.length + " images to load");

            bookmarks.init(this.images) // initialize scans bookmarks state
            // initialize scans loading
            if (this.scansProvider === null) {
                scansProvider.init(this.images, options.imgorder === 1) // new scan loader
            } else {
                scansProvider.initWithProvider(this.scansProvider) // scans already totally or partially loaded from this loader, switch the state to that scans loader
            }
            return true
        } else {
            console.log((this.url ? this.url : 'Current page') + " is not recognize as a chapter page by mirror implementation");
            return false
        }
    }
}
