const Untappd = require("untappd-js");
const fs = require('fs').promises
const puppeteer = require('puppeteer');
const util = require('util')
require('dotenv').config()
let client = new Untappd(process.env.ACCESS_TOKEN);

interface searchBeer {
    beer: {
        bid: Number
    },
    brewery: {
        name: String
    }
}

interface VmData {
    actualBeer?: object
    manualAlias? : string,
    link: string,
    name: string
    code: string,
    beer?: searchBeer,
    needsManual: boolean,
    blockList?: string[]
}

let hasResults = true
// Start by searching for things they have.
const storeId = 160
const urlBase = `https://www.vinmonopolet.no/vmp/search/?q=:relevance:visibleInSearch:true:availableInStores:${storeId}:mainCategory:%C3%B8l&searchType=product&currentPage=`
let currentPage = 0

async function runScrape(page) {
    let url = util.format('%s%d', urlBase, currentPage)
    await page.goto(url, {waitUntil: 'networkidle2'});
    let itemElements = await page.$$('.product-item')
    if (!itemElements.length) {
        hasResults = false
        return
    }
    let files = await fs.readdir('./data')
    let datas = {}
    let readJobs = files.map(async filename => {
        let data = await fs.readFile('./data/' + filename)
        let json = JSON.parse(data)
        datas[filename] = json
    })
    await Promise.all(readJobs)
    let codeJobs = itemElements.map(async function(element) {
        let code = await element.$eval('.product__code', node => node.innerText)
        let link = await element.$eval('.product-item__info-container a', node => node.getAttribute('href'))
        link = 'https://vinmonopolet.no' + link
        let name = await element.$eval('.product__name', node => node.innerText)
        let filename = createFileName(code, storeId)
        if (!code.length || !link.length) {
            return
        }
        let data: VmData = {
            needsManual: false,
            name,
            link,
            code,
            blockList: []
        }
        if (datas[code]) {
            let storedData: VmData = datas[code]
            if (storedData.beer) {
                data.beer = storedData.beer
            }
            if (storedData.blockList) {
                data.blockList = storedData.blockList
            }
        }
        await storeData(data, storeId)
    })
    await Promise.all(codeJobs)
    currentPage++
}

function createFileName(id: string, storeId) {
    return './data' + storeId + '/' + id
}

async function storeData(data: VmData, storeId) {
    let id = data.code
    let filename = createFileName(id, storeId)
    await fs.writeFile(filename, JSON.stringify(data))
}

async function searchAndSaveUntappd(datas) {
    let keys = Object.keys(datas)
    var unknowns = 0
    var knowns = 0
    let searchJobs = keys.map(async key => {
        let storedData: VmData = datas[key]
        let data;
        if (storedData.beer) {
            storedData.needsManual = false
            await storeData(storedData, storeId)
            knowns++
            return
        }
        try {
            let searchTerm = storedData.name
            if (storedData.manualAlias) {
                searchTerm = storedData.manualAlias
            }
            if (storedData.needsManual && !storedData.manualAlias) {
                unknowns++
                return
            }
            data = await client.beerSearch({q: searchTerm})
        }
        catch(err) {
            unknowns++
            return
        }
        if (!data.response || !data.response.beers || !data.response.beers.items || !data.response.beers.items.length) {
            console.log(storedData, 'no beer found')
            storedData.needsManual = true
            unknowns++
            await storeData(storedData, storeId)
            return
        }
        data.response.beers.items.forEach(beer => {
            if (storedData.beer) {
                return
            }
            let id: string = beer.beer.bid.toString()
            if (storedData.blockList && storedData.blockList.indexOf(id) !== -1) {
                return
            }
            knowns++
            storedData.beer = beer
        })
        if (!storedData.beer) {
            console.log(storedData, 'no beer found')
            storedData.needsManual = true
            unknowns++
        }
        await storeData(storedData, storeId)
    })
    await Promise.all(searchJobs)
    console.log('Currently ', unknowns, 'unknowns')
    console.log('Currently ', knowns, 'knowns')
}

async function scrapeUntappdSearch() {
    let datas = await getDatas()
    await searchAndSaveUntappd(datas)
}

async function getDatas() {
    let dataDir = `./data${storeId}`
    let files = await fs.readdir(dataDir)
    let datas = {}
    let readJobs = files.map(async filename => {
        let data = await fs.readFile(`${dataDir}/${filename}`)
        let json = JSON.parse(data)
        datas[filename] = json
    })
    await Promise.all(readJobs)
    return datas
}

async function lookupUntappd() {
    let datas = await getDatas()
    let keys = Object.keys(datas)
    let knowns = 0, unknowns = 0
    let lookupJobs = keys.map(async key => {
        let data : VmData = datas[key]
        if (data.actualBeer) {
            knowns++
            return
        }
        if (!data.beer || !data.beer.beer) {
            unknowns++
            return
        }
        try {
            let udata = await client.beerInfo({BID: data.beer.beer.bid})
            data.actualBeer = udata.response.beer
            await storeData(data, storeId)
            knowns++
        }
        catch (err) {
            unknowns++
            return
        }
    })
    await Promise.all(lookupJobs)
    console.log('Currently ', unknowns, 'unknowns')
    console.log('Currently ', knowns, 'knowns')
}

async function main() {
    const browser = await puppeteer.launch({headless: false});
    const page = await browser.newPage();
    if (process.argv[2] && process.argv[2] != "0") {
        console.log('Running vinmonopolet scrape')
        while (hasResults) {
            await runScrape(page)
        }
    }
    await browser.close();
    await scrapeUntappdSearch()
    await lookupUntappd()
}
main()
