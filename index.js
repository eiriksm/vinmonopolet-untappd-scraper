var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var Untappd = require("untappd-js");
var fs = require('fs').promises;
var puppeteer = require('puppeteer');
var util = require('util');
require('dotenv').config();
var client = new Untappd(process.env.ACCESS_TOKEN);
var hasResults = true;
// Start by searching for things they have.
var storeId = 160;
var urlBase = "https://www.vinmonopolet.no/vmp/search/?q=:relevance:visibleInSearch:true:availableInStores:" + storeId + ":mainCategory:%C3%B8l&searchType=product&currentPage=";
var currentPage = 0;
function runScrape(page) {
    return __awaiter(this, void 0, void 0, function () {
        var url, itemElements, files, datas, readJobs, codeJobs;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    url = util.format('%s%d', urlBase, currentPage);
                    return [4 /*yield*/, page.goto(url, { waitUntil: 'networkidle2' })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, page.$$('.product-item')];
                case 2:
                    itemElements = _a.sent();
                    if (!itemElements.length) {
                        hasResults = false;
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, fs.readdir('./data')];
                case 3:
                    files = _a.sent();
                    datas = {};
                    readJobs = files.map(function (filename) { return __awaiter(_this, void 0, void 0, function () {
                        var data, json;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fs.readFile('./data/' + filename)];
                                case 1:
                                    data = _a.sent();
                                    json = JSON.parse(data);
                                    datas[filename] = json;
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(readJobs)];
                case 4:
                    _a.sent();
                    codeJobs = itemElements.map(function (element) {
                        return __awaiter(this, void 0, void 0, function () {
                            var code, link, name, filename, data, storedData;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, element.$eval('.product__code', function (node) { return node.innerText; })];
                                    case 1:
                                        code = _a.sent();
                                        return [4 /*yield*/, element.$eval('.product-item__info-container a', function (node) { return node.getAttribute('href'); })];
                                    case 2:
                                        link = _a.sent();
                                        link = 'https://vinmonopolet.no' + link;
                                        return [4 /*yield*/, element.$eval('.product__name', function (node) { return node.innerText; })];
                                    case 3:
                                        name = _a.sent();
                                        filename = createFileName(code, storeId);
                                        if (!code.length || !link.length) {
                                            return [2 /*return*/];
                                        }
                                        data = {
                                            needsManual: false,
                                            name: name,
                                            link: link,
                                            code: code,
                                            blockList: []
                                        };
                                        if (datas[code]) {
                                            storedData = datas[code];
                                            if (storedData.beer) {
                                                data.beer = storedData.beer;
                                            }
                                            if (storedData.blockList) {
                                                data.blockList = storedData.blockList;
                                            }
                                        }
                                        return [4 /*yield*/, storeData(data, storeId)];
                                    case 4:
                                        _a.sent();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    });
                    return [4 /*yield*/, Promise.all(codeJobs)];
                case 5:
                    _a.sent();
                    currentPage++;
                    return [2 /*return*/];
            }
        });
    });
}
function createFileName(id, storeId) {
    return './data' + storeId + '/' + id;
}
function storeData(data, storeId) {
    return __awaiter(this, void 0, void 0, function () {
        var id, filename;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    id = data.code;
                    filename = createFileName(id, storeId);
                    return [4 /*yield*/, fs.writeFile(filename, JSON.stringify(data))];
                case 1:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function searchAndSaveUntappd(datas) {
    return __awaiter(this, void 0, void 0, function () {
        var keys, unknowns, knowns, searchJobs;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    keys = Object.keys(datas);
                    unknowns = 0;
                    knowns = 0;
                    searchJobs = keys.map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                        var storedData, data, searchTerm, err_1;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    storedData = datas[key];
                                    if (!storedData.beer) return [3 /*break*/, 2];
                                    storedData.needsManual = false;
                                    return [4 /*yield*/, storeData(storedData, storeId)];
                                case 1:
                                    _a.sent();
                                    knowns++;
                                    return [2 /*return*/];
                                case 2:
                                    _a.trys.push([2, 4, , 5]);
                                    searchTerm = storedData.name;
                                    if (storedData.manualAlias) {
                                        searchTerm = storedData.manualAlias;
                                    }
                                    if (storedData.needsManual && !storedData.manualAlias) {
                                        unknowns++;
                                        return [2 /*return*/];
                                    }
                                    return [4 /*yield*/, client.beerSearch({ q: searchTerm })];
                                case 3:
                                    data = _a.sent();
                                    return [3 /*break*/, 5];
                                case 4:
                                    err_1 = _a.sent();
                                    unknowns++;
                                    return [2 /*return*/];
                                case 5:
                                    if (!(!data.response || !data.response.beers || !data.response.beers.items || !data.response.beers.items.length)) return [3 /*break*/, 7];
                                    console.log(storedData, 'no beer found');
                                    storedData.needsManual = true;
                                    unknowns++;
                                    return [4 /*yield*/, storeData(storedData, storeId)];
                                case 6:
                                    _a.sent();
                                    return [2 /*return*/];
                                case 7:
                                    data.response.beers.items.forEach(function (beer) {
                                        if (storedData.beer) {
                                            return;
                                        }
                                        var id = beer.beer.bid.toString();
                                        if (storedData.blockList && storedData.blockList.indexOf(id) !== -1) {
                                            return;
                                        }
                                        knowns++;
                                        storedData.beer = beer;
                                    });
                                    if (!storedData.beer) {
                                        console.log(storedData, 'no beer found');
                                        storedData.needsManual = true;
                                        unknowns++;
                                    }
                                    return [4 /*yield*/, storeData(storedData, storeId)];
                                case 8:
                                    _a.sent();
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(searchJobs)];
                case 1:
                    _a.sent();
                    console.log('Currently ', unknowns, 'unknowns');
                    console.log('Currently ', knowns, 'knowns');
                    return [2 /*return*/];
            }
        });
    });
}
function scrapeUntappdSearch() {
    return __awaiter(this, void 0, void 0, function () {
        var datas;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDatas()];
                case 1:
                    datas = _a.sent();
                    return [4 /*yield*/, searchAndSaveUntappd(datas)];
                case 2:
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
function getDatas() {
    return __awaiter(this, void 0, void 0, function () {
        var dataDir, files, datas, readJobs;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataDir = "./data" + storeId;
                    return [4 /*yield*/, fs.readdir(dataDir)];
                case 1:
                    files = _a.sent();
                    datas = {};
                    readJobs = files.map(function (filename) { return __awaiter(_this, void 0, void 0, function () {
                        var data, json;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fs.readFile(dataDir + "/" + filename)];
                                case 1:
                                    data = _a.sent();
                                    json = JSON.parse(data);
                                    datas[filename] = json;
                                    return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(readJobs)];
                case 2:
                    _a.sent();
                    return [2 /*return*/, datas];
            }
        });
    });
}
function lookupUntappd() {
    return __awaiter(this, void 0, void 0, function () {
        var datas, keys, knowns, unknowns, lookupJobs;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, getDatas()];
                case 1:
                    datas = _a.sent();
                    keys = Object.keys(datas);
                    knowns = 0, unknowns = 0;
                    lookupJobs = keys.map(function (key) { return __awaiter(_this, void 0, void 0, function () {
                        var data, udata, err_2;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0:
                                    data = datas[key];
                                    if (data.actualBeer) {
                                        knowns++;
                                        return [2 /*return*/];
                                    }
                                    if (!data.beer || !data.beer.beer) {
                                        unknowns++;
                                        return [2 /*return*/];
                                    }
                                    _a.label = 1;
                                case 1:
                                    _a.trys.push([1, 4, , 5]);
                                    return [4 /*yield*/, client.beerInfo({ BID: data.beer.beer.bid })];
                                case 2:
                                    udata = _a.sent();
                                    data.actualBeer = udata.response.beer;
                                    return [4 /*yield*/, storeData(data, storeId)];
                                case 3:
                                    _a.sent();
                                    knowns++;
                                    return [3 /*break*/, 5];
                                case 4:
                                    err_2 = _a.sent();
                                    unknowns++;
                                    return [2 /*return*/];
                                case 5: return [2 /*return*/];
                            }
                        });
                    }); });
                    return [4 /*yield*/, Promise.all(lookupJobs)];
                case 2:
                    _a.sent();
                    console.log('Currently ', unknowns, 'unknowns');
                    console.log('Currently ', knowns, 'knowns');
                    return [2 /*return*/];
            }
        });
    });
}
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var browser, page;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, puppeteer.launch({ headless: false })];
                case 1:
                    browser = _a.sent();
                    return [4 /*yield*/, browser.newPage()];
                case 2:
                    page = _a.sent();
                    if (!(process.argv[2] && process.argv[2] != "0")) return [3 /*break*/, 5];
                    console.log('Running vinmonopolet scrape');
                    _a.label = 3;
                case 3:
                    if (!hasResults) return [3 /*break*/, 5];
                    return [4 /*yield*/, runScrape(page)];
                case 4:
                    _a.sent();
                    return [3 /*break*/, 3];
                case 5: return [4 /*yield*/, browser.close()];
                case 6:
                    _a.sent();
                    //await scrapeUntappdSearch()
                    return [4 /*yield*/, lookupUntappd()];
                case 7:
                    //await scrapeUntappdSearch()
                    _a.sent();
                    return [2 /*return*/];
            }
        });
    });
}
main();
