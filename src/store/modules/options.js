import storedb from '../../amr/storedb'
import Axios from 'axios';

/**
 * Default options of AMR.
 * Each option MUST figure in this object
 */
const default_options = {
    /**
     * Options used by background script
     */
    "impl-repositories": [ // repositories containing mirrors implementations
        "https://community.allmangasreader.com/latest_v2/",
        "https://raw.github.com/AllMangasReader-dev/mirrors/master/"
    ],
    shownotifications: 1, //display notifications on new chapter
    nocount: 1, // 1 : display gray sharingan and normal if new chaps; 0 : badge

    /**
     * Options used in content scripts (included in mangas pages)
     */
    displayChapters: 1, // display scans as a book
    newbar: 1,
    /**
     * mode = 1 --> images are displayed on top of one another
     * mode = 2 --> images are displayed two by two occidental reading mode
     * mode = 3 --> images are displayed two by two japanese reading mode
     */
    displayMode: 3,
    addauto: 1, // automatically mark chapters as read while reading
    resize: 1, // resize scans to fit in viewport
    debug: 1, // display debug traces in content script, background, popup, ...
    autobm: 1, // bookmark automatically the scans when dlbclicked in page
    markwhendownload: 0, // mark mangas as read when all images downloaded
    prefetch: 1, // load next chapter in background while reading 
    groupmgs: 1, // group manga with similar name (one piece and One Piece)
    lrkeys: 1, // use arrows keys to read chapter
    rightnext: 1,

    /**
     * Categories states, each custom category is stored in localStorage in this array
     * states are 
     *  - include (include mangas from this cat), 
     *  - exclude (exclude manga from this cat), 
     *  - <empty> (does not care of this cat)
     */
    categoriesStates: [
        { name: "New", state: "include", type: "native" },
        { name: "Read", state: "include", type: "native" },
        { name: "Unread", state: "include", type: "native" },
        { name: "One Shots", state: "include", type: "native" }
    ]
}

/**
 *  initial state of amr options
 */
const state = default_options

// getters
const getters = {
    /**
     * Return the whole options object
     */
    options: state => state,
}

// actions
const actions = {
    /**
     * Override default options with options values in localStorage
     * @param {*} param0 
     */
    initOptions({ commit, dispatch }) {
        for (let key of Object.keys(state)) {
            let storedVal = localStorage["o." + key];
            if (storedVal) {
                commit('setOption', { key: key, value: storedVal });
            }
        }
    },
    /**
     * Set an option
     * @param {*} param0 
     * @param {*} keyValObj object with key and value fields
     */
    setOption({ commit, dispatch }, keyValObj) {
        commit('setOption', keyValObj);
        localStorage["o." + keyValObj.key] = keyValObj.value;
    }
}

/**
 * All possible mutations on options
 * It is very important to write a mutation each time we need to update or create fields in options.
 * This way, mutations are propagated in the different instances of the store.
 * If not, some modifications can be not reflected and not saved to the database.
 * A mutation MUST be a synchrone function
 */
const mutations = {
    /**
     * Update options
     * @param {*} state 
     * @param {*} opts object ovveriding defaults 
     */
    extendOptions(state, opts) {
        Object.assign(state, opts);
    },
    /**
     * Set {key, value} option
     * @param {*} state 
     * @param {*} obj containing key and value
     */
    setOption(state, { key, value }) {
        if (!obj.key) console.error("Impossible to set option with undefined key; value is " + obj.value);
        else state[obj.key] = obj.value;
    }
}

export default {
    state,
    getters,
    actions,
    mutations
}