   		 /**
         * @description Tool is used for group work order issue prints
         *              
         * @NApiVersion 2.1
         * @NScriptType Suitelet
         * @author Kamil Nowak
         */
             define(['N/render', 'N/runtime', 'N/search', 'N/log'],
             function (render, runtime, search, log) {
                 let exports = {};
                 
                 function addQuoteToItem(itemsArray) {
                     let arrayOfWords = [];
                     for (var i = 0; i < itemsArray.length; i++) {
                         var txt = "'";
                         txt += itemsArray[i] + "'";
                         arrayOfWords.push(txt);
                     }
                     return arrayOfWords;
                 };
         
                 function checkIfUndefined(param) {
                     if (param !== undefined) return param;
                     if (param === undefined) return '';
                 }
         
                 function uniqueArray(ar) {
                     var j = {};
                   
                     ar.forEach( function(v) {
                         j[v+ '::' + typeof v] = v;
                     });
                   
                     return Object.keys(j).map(function(v){
                         return j[v];
                     });
                 };
         
                 function getBinAvailable(itemid, binid) {
                     let qtyOnHand = '';
                     const filter1 = search.createFilter({
                         name: 'internalid',
                         operator: search.Operator.ANYOF,
                         values: [itemid]
                     });
                     const filter2 = search.createFilter({
                         name: 'binnumber',
                         join: 'binonhand',
                         operator: search.Operator.ANYOF,
                         values: [binid]
                     });
                     const column3 = search.createColumn({
                         name: 'formulatext',
                         formula: '{binonhand.quantityavailable}'
                     });
                     const column4 = search.createColumn({
                         name: 'formulatext',
                         formula: '{binonhand.binnumber}'
                     });
                     const srch = search.create({
                         type: search.Type.ITEM,
                         filters: [filter1,filter2],
                         columns: [column3, column4]
                     });
         
                     let pagedResults = srch.runPaged();
                     pagedResults.pageRanges.forEach(function(pageRange) {
                         let currentPage = pagedResults.fetch({index: pageRange.index});
                         let data = currentPage.data;
                         let parsedData = JSON.parse(JSON.stringify(data))
         
                         for (let i = 0; i < data.length; i ++) {
                             return qtyOnHand += parsedData[i].values.formulatext
                         };
                     });
         
                     return qtyOnHand
                 };
         
                 function getIssueBinFromWO(itemid, wointernalid) {
                     let issueBin = '';
                     const filter1 = search.createFilter({
                         name: 'internalid',
                         operator: search.Operator.ANYOF,
                         values: [wointernalid]
                     });
                     const filter2 = search.createFilter({
                         name: 'mainline',
                         operator: search.Operator.IS,
                         values: false
                     });
                     const column1 = search.createColumn({
                         name: 'item'
                     });
                     const column2 = search.createColumn({
                         name: 'custcol_issue_bin_'
                     });
         
                     const srch = search.create({
                         type: search.Type.WORK_ORDER,
                         filters: [filter1,filter2],
                         columns: [column1, column2]
                     });
         
                     let pagedResults = srch.runPaged();
                     pagedResults.pageRanges.forEach(function(pageRange) {
                         let currentPage = pagedResults.fetch({index: pageRange.index});
                         let data = currentPage.data;
                         let parsedData = JSON.parse(JSON.stringify(data))
         
                         for (let i = 0; i < data.length; i ++) {
                             // log.debug({
                             //     title: 'itemfromwo',
                             //     details: parsedData[i]
                             // });
                            if(parsedData[i].values.item[0].value === itemid) {
                             // log.debug({
                             //     title: 'itemfromwo',
                             //     details: JSON.stringify(parsedData[i].values.custcol_issue_bin_[0].text)
                             // });
                             let issueBin = checkIfUndefined(parsedData[i].values.custcol_issue_bin_[0]);
                            //  log.debug({
                            //      title: 'undefined?',
                            //      details: issueBin
                            //  });
                                return !parsedData[i].values.custcol_issue_bin_[0] ? '' : issueBin += parsedData[i].values.custcol_issue_bin_[0].text;}
                         };
                     });
         
                     return issueBin;
                 };
               
                 function onRequest(context) {
                     if (context.request.method === 'GET') {
                        let current_user = runtime.getCurrentUser();
                        let result = [];
                        let woNumbers = [];
                        let woiItems = [];
                        let woiNumbers = [];
                        let createdFromNumbers = [];
                        let createdFromNumbersID = [];
                        let items = context.request.parameters.items_id;
                        let today = new Date();
                        let dd = String(today.getDate())
                        let mm = String(today.getMonth() + 1)
                        let yyyy = today.getFullYear();
                        const parsedItems = JSON.parse(items)
                        const itemsArray = items.split(",");
                        const delimiter = /\u0005/;
                        const selectField = items.split(delimiter);
                        const woiIdsTxt = addQuoteToItem(parsedItems).toString();
                        const PDF = {
                            title: 'Rozchód Wewnętrzny (RW)',
                            nr: 'Nr:',
                            woNr: 'Dokument WO:',
                            soNr: 'Dokument SO/WO:',
                            date: 'Data wystawienia:'
                        }
                        today = dd + '-' + mm + '-' + yyyy;

                         log.debug({
                             title: 'user: ',
                             details: JSON.stringify(current_user)
                         })
                       
                         log.debug({
                           details: 'Blank screen: ' + JSON.stringify(items)
                         });
                         if (!items) {
                           log.error("No Invoice ID passed to SuiteLet")
                           return false;
                         };
                           
                           log.debug({
                           parsedItems: woiIdsTxt
                         });
         
                         const filter1 = search.createFilter({
                             name: 'mainline',
                             operator: search.Operator.IS,
                             values: false
                         });
                         const filter2 = search.createFilter({
                             name: 'formulanumeric',
                             operator: search.Operator.EQUALTO,
                             values: [1],
                             formula: 'CASE WHEN {quantity}>0 THEN 1 ELSE 0 END'
                         });
                         const filter4 = search.createFilter({
                             name: 'formulanumeric',
                             operator: search.Operator.EQUALTO,
                             values: [1],
                             formula: 'CASE WHEN {internalid} IN('+ woiIdsTxt +') THEN 1 ELSE 0 END'
                         });
                         const column1 = search.createColumn({
                             name: 'item'
                         });
                         const column2 = search.createColumn({
                             name: 'quantity'
                         });
                         const column3 = search.createColumn({
                             name: 'binnumber'
                         });
                         const column4 = search.createColumn({
                             name: 'tranid',
                             join: 'createdfrom'
                         });
                         const column5 = search.createColumn({
                             name: 'trandate'
                         });
                         const column6 = search.createColumn({
                             name: 'subsidiary'
                         });
                         const column7 = search.createColumn({
                             name: 'binonhandcount',
                             join: 'item'
                         });
                         const column8 = search.createColumn({
                             name: 'tranid'
                         });
                         const column9 = search.createColumn({
                             name: 'createdfrom',
                             join: 'createdfrom'
                         });
                         const column10 = search.createColumn({
                            name: 'formulatext',
                            formula: '{binnumber.internalid}'
                         });
                         const column11 = search.createColumn({
                             name: 'createdfrom'
                         });
                         const column12 = search.createColumn({
                             name: 'vendorname',
                             join: 'item'
                         });
                         const srch = search.create({
                             type: search.Type.WORK_ORDER_ISSUE,
                             filters: [filter1,filter2, filter4],
                             columns: [column1, column2, column3, column4, column5, column6, column7, column8, column9, column10, column11, column12]
                         });
                           
                         let pagedResults = srch.runPaged();
                         pagedResults.pageRanges.forEach(function(pageRange) {
                             let currentPage = pagedResults.fetch({index: pageRange.index});
                             let data = currentPage.data;
                             let parsedData = JSON.parse(JSON.stringify(data))
         
                             for (let i = 0; i < data.length; i ++) {
                                 // log.debug({
                                 //     title: 'item 0: ',
                                 //     details: parsedData[i]
                                 // });
                                 woiItems.push(parsedData[i])
                             };
                         });
                         
                         
                         woiItems.reduce(function(res, value) {
                             woNumbers.push(value.values["createdfrom.tranid"]);
                             woiNumbers.push(value.values.tranid);
                             createdFromNumbers.push(value.values.createdfrom[0].text);
                             createdFromNumbersID.push(value.values.createdfrom[0].value);
                             
                             if(!res[value.values.item[0].text]) {
                                 // log.debug({
                                 //     title: 'res[value]: ',
                                 //     details: JSON.stringify(value)
                                 // });
                                 const id = value.values.item[0].value;
                                 const name = value.values.item[0].text;
                                 const binnum = value.values.binnumber;
                                 const binid = value.values.formulatext;
                                 const qtyOnHand = getBinAvailable(value.values.item[0].value, value.values.formulatext);
                                 const issueBin = getIssueBinFromWO(value.values.item[0].value, value.values.createdfrom[0].value);
                                 const vendorname = value.values["item.vendorname"]
                                 log.debug({
                                     title: 'onhand',
                                     details: getBinAvailable(value.values.item[0].value, value.values.formulatext)
                                 });
                                 res[value.values.item[0].text] = {id: checkIfUndefined(id), name: checkIfUndefined(name), qty: 0, binnum: checkIfUndefined(binnum), binid: checkIfUndefined(binid), onhand: checkIfUndefined(qtyOnHand), issuebin: checkIfUndefined(issueBin), vendorname: checkIfUndefined(vendorname)};
                                 result.push(res[value.values.item[0].text]);
                                
                             }
                             res[value.values.item[0].text].qty += parseInt(value.values.quantity);
                             return res
                         }, {});
         
                        
                            log.debug({
                                title: 'result',
                                details: JSON.stringify(result)
                            });  
                            log.debug({
                                title: 'woNumbers',
                                details: JSON.stringify(uniqueArray(woNumbers))
                            });
                            log.debug({
                                title: 'createdfromnumbers',
                                details: JSON.stringify(uniqueArray(createdFromNumbers))
                            });  

                            const uniqArr = uniqueArray(woNumbers);
                            const woiUniqArr = uniqueArray(woiNumbers);
                            const createdFromUniqArr = uniqueArray(createdFromNumbers);
                      
                         
         
                            const xml = "<?xml version=\"1.0\"?>\n<!DOCTYPE pdf PUBLIC \"-//big.faceless.org//report\" \"report-1.1.dtd\">\n<pdf>\n<body font-size=\"18\">\nHello World!\n</body>\n</pdf>";
                         
         
                            const file = render.xmlToPdf({
                                xmlString: xml
                            });
         
                         let header = '<table style="height:100%; width:100%;"><tr style="font-weight: bold; background-color: #d7d7d7;"><td align="center" colspan="2">' + PDF.title + '</td></tr>' +
                         '<tr><td>'+ PDF.nr +'</td>' +
                         '<td align="right" ><b>'; 
                         for (let i = 0; i < woiUniqArr.length; i++) {
                             header += woiUniqArr[i] + '; '
                         }
                         header += '</b></td></tr>' +
                         '<tr><td>' + PDF.woNr + ' </td><td align="right"><b><p>';
                         for (var i = 0; i < uniqArr.length; i++) {
                             header += uniqArr[i] +'; '
                         };
                         header += '</p></b></td></tr>' +
                         '<tr><td>' + PDF.soNr + ' </td><td align="right" ><b>';
                         for (var i = 0; i < createdFromUniqArr.length; i++) {
                             header += createdFromUniqArr[i] + '; '
                         };
                         header += '</b></td></tr>' +
                         '<tr><td>' + PDF.date + ' </td><td align="right" ><b>';
                         header += today
                         header += '</b></td></tr><tr align="center" style="font-weight: bold; background-color: #d7d7d7; color: #d7d7d7;"><td>' + 'TYTUŁ' + '</td></tr></table>'
         
                         let res = '<table style="height:100%; width:30%;">' +
                         '<tr style="background-color: #d7d7d7;"><td ><strong>' + 'APS Energia' + '</strong></td></tr>' +
                         '<tr><td style="min-height: 80px; padding: 3px; border: 1px solid black;">' +
                         //beautifier(searchResults[0].columns.billaddress).split('\n').join('<br/>') +
                         '<br/>' + 'NIP: ' + ': ' +
                         'randomowy numer' +
                         '</td>' +
                         '</tr></table>';
         
                         let xmlToString = '<?xml version="1.0"?>\n<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">\n<pdf>\n<head>\n';
                         xmlToString += '<style>body {font-family: russianfont, NotoSans, sans-serif; font-size: 7.5pt;}table {font-size: 7.5pt;table-layout: fixed;width: 100%;} th {font-weight: bold;padding: 4px 6px;}td {padding: 4px 6px;}td>p { text-align:left }th>p { text-align:left }.border{border: 1px solid #bbb;}.trhighlight{background-color: #eee;}</style></head><body fontsize="18">'
                         //xmlToString += res 
                         xmlToString += header + '<table style="table-layout:fixed; margin-top:20px; border: 1px solid black;">'
                         xmlToString += '<thead><tr style="background-color: #d7d7d7; border-bottom: 1px solid black;">' +
                         '<th align="center" style="width: 5%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'LP' + '</th>' +
                         '<th align="center" style="width: 30%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'Indeks' + '</th>' +
                         '<th align="center" style="width: 16%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'Nazwa dostawcy' + '</th>' +
                         '<th align="center" style="width: 16%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'Z półki' + '</th>' +
                         '<th align="center" style="width: 9%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'Ilość' + '</th>' +
                         '<th align="center" style="width: 8%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'On hand' + '</th>' +
                         '<th align="center" style="width: 16%; border-right: 1px solid black; border-left: 1px solid black; font-weight: none;">' + 'BIN' + '</th>' +
                         '</tr></thead>'
         
                         for(let i = 0; i < result.length; i++) {
                             log.debug({
                                 title: 'binnum',
                                 details: result[i]
                             })
                             let counter = i + 1;
                             if(i % 2 === 0) {
                                 xmlToString += '<tr style="border-bottom 1px solid black; font-size: 8px; background-color: #f0f0f0;">';
                             } else {
                                 xmlToString += '<tr style="border-bottom 1px solid black; font-size: 8px;">';
                             }
                             xmlToString += '<td align="center" style="border-right: 1px solid black;">'+ counter + '</td>';
                             xmlToString += '<td align="left" style="border-right: 1px solid black;">'+ result[i].name + '</td>';
                             xmlToString += '<td style="border-right: 1px solid black;">'+ result[i].vendorname + '</td>';
                             xmlToString += '<td style="border-right: 1px solid black;">'+ result[i].issuebin + '</td>';
                             xmlToString += '<td style="border-right: 1px solid black;">'+ result[i].qty + '</td>';
                             xmlToString += '<td style="border-right: 1px solid black;">'+ result[i].onhand + '</td>';
                             xmlToString += '<td style="border-right: 1px solid black;">'+ result[i].binnum + '</td></tr>';
         
                         }
         
                         xmlToString += "</table>"
                         xmlToString += '<table align="right" style="width:15%; margin-top:100px;">'
                         xmlToString += '<tr><td align="center">' + current_user.name + '</td></tr>'
                         xmlToString += '<tr><td align="center" style="border-top:1px solid #000;">' + 'Podpis' + '</td></tr></table>';
                         xmlToString += '</body>\n</pdf>';
                         
                         context.response.renderPdf({
                             xmlString: xmlToString
                         });
         
                         context.response.write(file.getContents());
                       
                         return;
                     } 
                 }
                 exports.onRequest = onRequest;
                 return exports;
             });