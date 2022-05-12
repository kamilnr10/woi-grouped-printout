/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
 define(['N/ui/serverWidget', 'N/search', 'N/record', 'N/log'], (serverWidget, search, record, log) => {
   
    const addQuoteToItem = (itemsArray) => {
        let arrayOfWords = [];
        itemsArray.forEach((item) => {
            let txt ="";
            txt += item;
            arrayOfWords.push(txt);
        })
        return arrayOfWords
    }

    const onRequest = (scriptContext) => {
        if (scriptContext.request.method === 'GET') {
            let form = serverWidget.createForm({
                title: 'Work Order Issues Printout'
            });


            let select = form.addField({
                id: 'selectfield',
                type: serverWidget.FieldType.MULTISELECT,
                label: 'Select',
                source: "workorder"
            });
            select.layoutType = serverWidget.FieldLayoutType.NORMAL;
            select.updateBreakType({
                breakType: serverWidget.FieldBreakType.STARTCOL
            });

            form.addSubmitButton({
                label: 'Submit Button'
            });

            scriptContext.response.writePage(form);
        } else {
            const delimiter = /\u0005/;
            const selectField = scriptContext.request.parameters.selectfield.split(delimiter);
            const selectedFields = scriptContext.request.parameters.selectfield;
     
            let form = serverWidget.createForm({
                title: 'WO Issues print'
            });

            let sublist = form.addSublist({
                id: 'sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Check Work Order Issues'
            });
            sublist.addField({
                id: 'sublist1',
                type: serverWidget.FieldType.TEXT,
                label: 'Name'
            });
            sublist.addField({
                id: 'sublist2',
                type: serverWidget.FieldType.TEXT,
                label: 'Internal ID'
            });
          sublist.addField({
                id: 'sublist3',
                type: serverWidget.FieldType.TEXT,
                label: 'Created from'
            });
            sublist.addField({
                id : 'custpage_id',
                label : 'Check',
                type : serverWidget.FieldType.CHECKBOX
               });
            

            sublist.addMarkAllButtons()

            log.debug({
                details: 'selectField: ' + Array.isArray(selectField)
            });

            const filter1 = search.createFilter({
                name: 'mainline',
                operator: search.Operator.IS,
                values: true
            });
            const filter2 = search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: selectField
            });
            const filter3 = search.createFilter({
                name: 'formulanumeric',
                operator: search.Operator.EQUALTO,
                values: [1],
                formula: 'CASE WHEN {createdfrom.internalid} IN('+ addQuoteToItem(selectField) +') THEN 1 ELSE 0 END'
            });
            const filter4 = search.createFilter({
                name: 'internalid',
                operator: search.Operator.ANYOF,
                values: [selectField]
            });
            const column1 = search.createColumn({name: 'recordtype'});
            const column2 = search.createColumn({name: 'number'});

            const srch = search.create({
                type: search.Type.WORK_ORDER_ISSUE,
                filters: [filter1, filter3],
                columns: [column1, column2]
            });
            let counter = 0;
            let pagedResults = srch.runPaged();
                pagedResults.pageRanges.forEach(function(pageRange){
                let currentPage = pagedResults.fetch({index: pageRange.index});
                currentPage.data.forEach(function(result){
                    let wo = record.load({
                        type: record.Type.WORK_ORDER_ISSUE,
                        id: result.id
                        });
                    let woTranId = wo.getValue({
                        fieldId: 'tranid'
                        })
                    let woiCreatedFrom = wo.getValue({
                        fieldId: 'createdfrom'
                        })
                    let woRecord = record.load({
                        type: record.Type.WORK_ORDER,
                        id: woiCreatedFrom
                    });
                    const woNum = woRecord.getValue({
                        fieldId: 'tranid'
                    });
                    sublist.setSublistValue({
                        id: 'sublist1',
                        line: counter,
                        value: woTranId
                    });
                    sublist.setSublistValue({
                        id: 'sublist2',
                        line: counter,
                        value: result.id
                    });
                  	sublist.setSublistValue({
                        id: 'sublist3',
                        line: counter,
                        value: woNum
                    });
                    counter++
                 log.debug({
                     title: 'work order info: ',
                     details:  JSON.stringify(woNum)
                 });
                }
            )
        });
       

            
            form.clientScriptModulePath = 'SuiteScripts/setButton-clientscript.js';
        
            form.addButton({
                id: 'print_rw',
                label: 'Print RW',
                functionName: 'goToNextCase()'
            });

            scriptContext.response.writePage(form);
        }
    }

    return {onRequest}
});


