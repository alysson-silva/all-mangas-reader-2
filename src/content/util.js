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
import options from "./options";

class Util {
    //Used to request background page action
    async sendExtRequest(request, button, callback, backsrc) {
        //Prevent a second request
        if (button.data("currentlyClicked")) return;
        button.data("currentlyClicked", true);

        //Display a loading image
        let _ancSrc;
        if (button.is("img")) {
            _ancSrc = button.attr("src");
            button.attr("src", browser.extension.getURL("icons/load16.gif"));
        } else {
            if (button.is(".button")) {
                _ancSrc = $("<img src='" + browser.extension.getURL("icons/ltload.gif") + "'></img>");
                _ancSrc.appendTo(button);
            }
            if (button.is(".category") || button.is(".mgcategory")) {
                _ancSrc = $("<img src='" + browser.extension.getURL("icons/load10.gif") + "'></img>");
                _ancSrc.appendTo(button);
            }
        }
        //Call the action
        await browser.runtime.sendMessage(request);
        //setTimeout(function() {
        //Do the callback
        callback();
        //Removes the loading image
        if (button.is("img")) {
            if (backsrc) {
                button.attr("src", _ancSrc);
            }
        } else {
            if (button.is(".button") || button.is(".category") || button.is(".mgcategory")) {
                _ancSrc.remove();
            }
        }
        //Restore request
        button.removeData("currentlyClicked");
        //}, 1000);
    }
    removeProtocol(url) {
        if (url.indexOf("https") == 0) return url.substring(6);
        else if (url.indexOf("http") == 0) return url.substring(5);
        return url;
    }
    debug(message) {
        if (options.debug === 1) console.log(message);
    }
    /** test different related url to retrieve scan from url */
    getScan(src) {
        let urls = [
            src, 
            decodeURI(src), 
            this.removeProtocol(src), 
            decodeURI(this.removeProtocol(src))
        ];
        let imgScan;
        let i = 0;
        while ((!imgScan || imgScan.length === 0) && i < urls.length) {
            imgScan = $(".spanForImg img[src='" + urls[i] + "']");
            if (imgScan.length === 0) {
                imgScan = $("a.spanForImg[href='" + urls[i] + "'] img");
            }
            i++;
        }
        if (imgScan.length === 0) {
            $(".spanForImg img").each(function(ind, img) {
                if (urls.find($(img).data("urlToLoad")) >= 0) {
                    imgScan = $(img);
                    return false;
                }
            })
        }
        if (imgScan.length === 0) {
            console.error("Scan to bookmark not found !");
            return;
        }
        return imgScan;
    }
    /**
     * Return the path from a url (used for chapters url)
     */
    chapPath(chap_url) {
        if (!chap_url) return chap_url;
        return chap_url.split("/").slice(3).join("/")//new URL(chap_url).pathname
    }
    matchChapUrl(chap, tomatch) {
        return (this.chapPath(chap) === this.chapPath(tomatch))
    }
}
export default (new Util)