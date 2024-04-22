import * as puppeteer from "puppeteer";
import { pptrPointerCss } from "./styles";

export async function installPptrPointer(page: puppeteer.Page) {
    await page.evaluateOnNewDocument((pptrPointerCss) => {
        if (window !== window.parent) {
            // Only install in top-level frames
            return;
        }
        window.addEventListener(
            "DOMContentLoaded",
            () => {
                const styleElement = document.createElement("style");
                styleElement.innerHTML = pptrPointerCss;
                document.head.appendChild(styleElement);
                // Deploy the element containing our fake cursor image
                const cursorBox = document.createElement("puppeteer-mouse-pointer");
                document.body.appendChild(cursorBox);
                // Deploy the cursor information box, display coordinates and gen'l state
                const infoBox = document.createElement("puppeteer-mouse-info");
                document.body.appendChild(infoBox);

                document.addEventListener(
                    "pointermove",
                    (event) => {
                        cursorBox.style.left = event.pageX + "px";
                        cursorBox.style.top = event.pageY + "px";
                        infoBox.innerText = `x: ${Math.floor(event.pageX)}, y: ${Math.floor(event.pageY)}`;
                        infoBox.style.left = event.pageX + 10 + "px";
                        infoBox.style.top = event.pageY + 50 + "px";
                        infoBox.style.display = "block";
                    },
                    true // Capture events, so we see them first
                );
                document.addEventListener(
                    "mousedown",
                    (event) => {
                        // TBW
                    },
                    true
                );
                document.addEventListener(
                    "mouseup",
                    (event) => {
                        // TBW
                    },
                    true
                );
            },
            false
        ); // Do not use capture for window load event
    }, pptrPointerCss);
}
