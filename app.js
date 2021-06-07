var app = (function () {
    //GLOBAL VARIABLES n' SUCH
    var customers = []; //AN ARRAY
    var currentUser = { UserName: "UNKNOWN" }; //AN OBJECT

    return {
        //AND THE FUNCTIONS GO HERE...

        prepPage: function () {
            app.readSharePointUser();
            app.readCustomerInformation();
            app.checkCurrentUserMembership();
            app.readTestOfficers();
            app.readTasker();
        },

        readSharePointUser: function () { //THIS READS THE USER'S SP ACCOUNT AND PARSES OUT THE GARBAGE
            try {
                UpdateFormDigest(_spPageContextInfo.webServerRelativeUrl, _spFormDigestRefreshInterval); //REFRESH TOKEN

                currentUser.UserName = (_spPageContextInfo.userLoginName.substring(_spPageContextInfo.userLoginName.indexOf("\\") + 1)).toString().toLowerCase();
            }
            catch (ex) {
                alert("ERROR 001\n" + ex.message);
            }
        },

        readCustomerInformation: function () {
            var readCustomerInformation = $.ajax(
                {
                    url: _spPageContextInfo.webServerRelativeUrl + "/_api/web/lists/getByTitle('Customers')/items/"
                        + "?$top=1000"
                        + "&$select=ID, UserName, TextName"
                        + "&$filter=NotInAD ne '1'"
                        + "&$orderby=UserName",
                    type: "GET",
                    headers: {
                        "accept": "application/json;odata=verbose"
                    }
                });

            readCustomerInformation.fail(function (err) { //IF SP READ FAILS
                alert("ERROR 002\n" + err);
            });

            readCustomerInformation.done(function (data) { //IF SP READ SUCCEEDS
                try {
                    //THE ARRAY OF DATA HIDES IN HERE
                    customers = [];
                    var results = data.d.results;
                    results.forEach(function (cust) {
                        customers.push({ UserName: cust.UserName.toString(), TextName: cust.TextName.toString() });
                    });
                    //THERE'S A THING CALLED 'FIND', BUT IE DOESN"T SUPPORT IT, SO USE FILTER AS BELOW.  THIS COULD ALSO USE ARROW NOTATION (=>), BUT IE HATES THAT, TOO
                    var thisCust = customers.filter(function (obj) {
                        return obj.UserName.toLowerCase() == currentUser.UserName.toLowerCase();
                    })[0]; //FILTER RETURNS AN ARRAY, AND WE JUST WANT THE ONE
                    currentUser = thisCust;
                    $("#spnUserName").html("Logon User: " + currentUser.TextName);
                }
                catch (ex) {
                    alert("ERROR 003\n" + ex.message);
                }
            });
        },

        readUploadedFiles: function () {
            var readUploadedFiles = $.ajax(
                {
                    url: _spPageContextInfo.webServerRelativeUrl + "/_api/web/lists/getByTitle('AppTestLibrary')/items/"
                        + "?$top=1000"
                        + "&$select=Id, FileLeafRef"
                        //+ "&$filter=NotInAD ne '1'"
                        + "&$orderby=FileLeafRef",
                    type: "GET",
                    headers: {
                        "accept": "application/json;odata=verbose"
                    }
                });

            readUploadedFiles.fail(function (err) { //IF SP READ FAILS
                alert("ERROR 002\n" + err);
            });

            readUploadedFiles.done(function (data) { //IF SP READ SUCCEEDS

                try {
                    //THE ARRAY OF DATA HIDES IN HERE
                    var uploadedFiles = [];
                    var results = data.d.results;
                    results.forEach(function (file) {
                        uploadedFiles.push({ Id: file.Id, FileLeafRef: file.FileLeafRef.toString() });
                    });
                    app.populateUploadedFiles(uploadedFiles);
                    setTimeout(function () {
                        //THIS IS HOW JQuery GETS DOM OBJECTS AND DOES THINGS TO THEM
                        $("#spnViewTitle").html("Uploaded Files");
                        $("#divDisplaySpinner").hide();
                        $("#container").show();
                        $("#viewDiv").show();
                        $("#ticketScroll").show();
                        $("#divDetails").show();
                        $("#divDetailsTable").show();
                    }, 1000);

                }
                catch (ex) {
                    alert("ERROR 003\n" + ex.message);
                }
            });
        },

        checkCurrentUserMembership: function () { //GETS THE USER'S SP GROUPS
            var checkCurrentUserMembership = $.ajax(
                {
                    url: _spPageContextInfo.webServerRelativeUrl + "/_api/web/currentuser/groups",
                    type: "GET",
                    headers: {
                        "accept": "application/json;odata=verbose"
                    }
                }
            );
            checkCurrentUserMembership.fail(function (err) { //IF SP READ FAILS
                alert("ERROR 004\n" + err);
            });
            checkCurrentUserMembership.done(function (data) { //IF SP READ SUCCEEDS
                try {
                    //THE ARRAY OF DATA HIDES IN HERE
                    var results = data.d.results;
                    //REVERSE SORT
                    results.sort(function (a, b) {
                        if (a.LoginName > b.LoginName) {
                            return -1;
                        }
                        else if (a.LoginName < b.LoginName) {
                            return -1
                        }
                        else return 0
                    });
                    //setTimeout CAN DELAY THINGS
                    setTimeout(function () {
                        //THIS IS HOW JQuery GETS DOM OBJECTS AND DOES THINGS TO THEM
                        $("#spnViewTitle").html("My SharePoint Groups");
                        $("#divDisplaySpinner").hide();
                        $("#container").show();
                        $("#viewDiv").show();
                        $("#divDetails").show();
                        $("#divDetailsTable").show();
                    }, 1000);
                }
                catch (ex) {
                    alert("ERROR 005\n" + ex.message);
                }
            });
            checkCurrentUserMembership.always(function (data) { //DO THIS REGARDLESS OF SUCCESS OR FAILURE
                //NOTHING IN THIS CASE
            });
        },
	
	// A SIMPLE FUNCTION TO READ THE TEST OFFICERS SHAREPOINT LIST

        readTestOfficers: function () {
            $.ajax(
                {
                    url: _spPageContextInfo.webAbsoluteUrl + "/_api/web/lists/getByTitle('Test Officer')/items" +
                        "?$select=Title,ID",
                    type: "GET",
                    headers: {
                        "accept": "application/json;odata=verbose"
                    },
                    success: function (queryData) {
                        var results = queryData.d.results;
                        app.updateTestOfficerList(results); // WE ARE PASSING RETURNED DATA AS AN ARG TO THE updateTestOfficerList() FUNCTION
                    },
                    error: function (err) {
                        alert(JSON.stringify(err));
                    }
                }
            );
        },

	// WE USE THIS FUNCTION TO POPULATE THE #selTestOfficer FIELD IN OUR HTML FILE

        updateTestOfficerList: function (data) {
            var html = [];
            html.push("<option disabled='disabled' selected='selected' value='N/A'> -- Select Name -- </option>");
            for (var i = 0; i < data.length; i++) {
                html.push("<option value='" + data[i].ID + "'>" + data[i].Title + "</option>");
            }
            $('#selTestOfficer').html(html.join(''));
        },
	
	// FUNCTION TO READ THE TASKER SHAREPOINT LIST
	// TO-DO: FIGURE OUT HOW TO PULL Test_x0020_OfficerId AND ASSOCIATE IT WITH TEST OFFICER LIST ??? WHO KNOWS
	
        readTasker: function () {
            $.ajax(
                {
                    url: _spPageContextInfo.siteAbsoluteUrl + "/_api/web/lists/getByTitle('Tasker')/items" +
                        "?$select=ID,Test_x0020_OfficerId/ID,Title,Document_x0020_Type,EPG_x0020_Pub_x0020__x0023_,Classification,ADSS_x0020__x0023_,WAC,Division,Evaluated_x0020_Project,Secuity_x0020_Guide,Distribution_x0020_Statement,Comments,Doc_x0020_Stage" +
                        "&?$expand=Test_x0020_Officer/Title",
                    type: "GET",
                    headers: {
                        "accept": "application/json;odata=verbose"
                    },
                    success: function (queryData) {
                        var results = queryData.d.results;
                        app.updateTaskerList(results); // TAKE THE RETURN DATA AND CALL updateTaskerList() FUNCTION
                    },
                    error: function (err) {
                        alert(JSON.stringify(err));
                    }
                }
            );
        },
	
	// THIS FUNCTION LITERALLY DOES WHAT THE NAME IMPLIES... GETS A SHAREPOINT LIST ITEM BY ITS ID (WE USE THIS A LITTLE LATER)
	
        getItemById: function (id, listName) {
            return $.ajax({
                url: _spPageContextInfo.siteAbsoluteUrl + "/_api/Web/Lists/GetByTitle('" + listName + "')/Items(" + id + ")" +
                    "?$select=ID,Title,Document_x0020_Type,EPG_x0020_Pub_x0020__x0023_,Classification,ADSS_x0020__x0023_,WAC,Division,Evaluated_x0020_Project,Secuity_x0020_Guide,Distribution_x0020_Statement,Comments,Doc_x0020_Stage&?$expand=Test_x0020_Officer",
                method: "GET",
                headers: {
                    "Accept": "application/json;odata=verbose"
                },
                success: function (data) {
                    app.populateEditForm(data);
                },
                error: function (err) {
                    alert(JSON.stringify(err));
                }
            });
        },

	// THIS FUNCTION POPULATES OUR TASKER EDIT FORM WITH ASSOCIATED DATA WHEN YOU CLICK ON THAT LIST ITEM

        populateEditForm: function (data) {
            $("#selTestOfficer").val(data.d.Test_x0020_Officer);
            $("#division").val(data.d.Division);
            $("#adss").val(data.d.ADSS_x0020__x0023_);
            $("#wbs").val(data.d.WAC);
            $("#docTitle").val(data.d.Title);
            $("#classification").val(data.d.Classification);
            $("#evalProject").val(data.d.Evaluated_x0020_Project);
            $("#docType").val(data.d.Document_x0020_Type);
            $("#secGuide").val(data.d.Secuity_x0020_Guide);
            $("#distStatement").val(data.d.Distribution_x0020_Statement);
            $("#textbox").val(data.d.Comments);
        },

	// THIS FUNCTION PUSHES THE ACTUAL HTML OUT TO THE PAGE

        updateTaskerList: function (data) {
            var html = [];
            html.push(
                "<tr id='trHeader'>" +
                "<th>Title of Document</th>" +
                "<th>Document Type</th>" +
                "<th>EPG Pub #</th>" +
                "<th>Classification</th>" +
                "<th>ADSS #</th>" +
                "<th>WBS</th>" +
                "<th>Test Officer</th>" +
                "</tr>"
            );
            for (var i = 0; i < data.length; i++) {
                html.push("<tr id='trRows'><td><a href='javascript:void(0);' onclick='event.preventDefault(); displayImage(\".editForm\",\".close\"); app.getItemById(" + data[i].ID + ", \"Tasker\")'>" + data[i].Title + "</a></td>");
                html.push("<td>" + data[i].Document_x0020_Type + "</td>");
                html.push("<td>" + data[i].EPG_x0020_Pub_x0020__x0023_ + "</td>");
                html.push("<td>" + data[i].Classification + "</td>");
                html.push("<td>" + data[i].ADSS_x0020__x0023_ + "</td>");
                html.push("<td>" + data[i].WAC + "</td>");
                html.push("<td>" + data[i].Test_x0020_Officer + "</td></tr>");
            }
            $('#tasker').html(html.join(''));
        },
	
	// FUNCTION TO GET THE "FORM DIGEST" VALUE, BASICALLY LIKE A SESSION TOKEN
	
        getFormDigest: function (webUrl) {
            return $.ajax({
                url: webUrl + "/_api/contextinfo",
                method: "POST",
                headers: { "Accept": "application/json;odata=verbose" }
            });
        },

	// FUNCTION TO POST A NEW LIST ITEM (USER INPUTS DATA INTO HTML FORM) TO THE SPECIFIED SHAREPOINT LIST

        createListItem: function (webUrl, listName, itemProperties) {
            return app.getFormDigest(webUrl).then(function (data) {
                return $.ajax({
                    url: webUrl + "/_api/Web/Lists/GetByTitle('" + listName + "')/Items",
                    type: "POST",
                    processData: false,
                    contentType: "application/json;odata=verbose",
                    data: JSON.stringify(itemProperties),
                    headers: {
                        "Accept": "application/json;odata=verbose",
                        "X-RequestDigest": data.d.GetContextWebInformation.FormDigestValue // HERE IS THAT FORM DIGEST VALUE WE GOT FROM THE LAST FUNCTION
                    },
                    success: function (data) {
                        success(data);
                    },
                    error: function (err) {
                        alert(JSON.stringify(err));
                    }
                });
            });
        },
	
	// THIS FUNCTION CONVERTS THE HTML DATA INTO AN OBJECT (taskProperties) AND SENDS IT TO THE createListItem() FUNCTION

        taskerOnSubmit: function () {
            var testOfficer = $("#selTestOfficer").val();
            var division = ($("#division").val()).toString();
            var adss = $("#adss").val();
            var wbs = $("#wbs").val();
            var docTitle = $("#docTitle").val();
            var classification = ($("#classification").val()).toString();
            var evalProject = $("#evalProject").value;
            var docType = ($("#docType").val()).toString();
            if ($("#secGuide").val() == "checked") {
                var secGuide = true;
            } else {
                var secGuide = false;
            }
            if ($("#distStatement").val() == "checked") {
                var distStatement = true;
            } else {
                var distStatement = false;
            }
            var comments = $("#textbox").val();

            var taskProperties = {
                '__metadata': { 'type': 'SP.Data.TaskerListItem' },
                'Test_x0020_OfficerId': testOfficer,
                'Division': division,
                'ADSS_x0020__x0023_': adss,
                'WAC': wbs,
                'Title': docTitle,
                'Classification': classification,
                'Evaluated_x0020_Project': evalProject,
                'Document_x0020_Type': docType,
                'Secuity_x0020_Guide': secGuide,
                'Distribution_x0020_Statement': distStatement,
                'Comments': comments
            };

            app.createListItem(_spPageContextInfo.siteAbsoluteUrl, 'Tasker', taskProperties);
        },

	// HIDE DIFFERENT ELEMENTS OF THE PAGE UNTIL OTHERWISE SPECIFIED

        hideViews: function () {
            $("#viewDiv").hide();
            $("#divFileUploadView").hide();
            $("#ticketScroll").hide();
            $("#divDetails").hide();
            $("#divDetailsTable").hide();
            $("#initiateTasker").hide();
        }
    }
})();

//THIS CALLS A FUNCTION (app.prepPage) AFTER THE PAGE HAS LOADED
$(document).ready(app.prepPage);

function displayImage(modal, close) {
    document.querySelector(modal).style.display = "block";
    
    document.addEventListener(
        "click",
        function (e) {
            if (e.target.matches(close)) {
                closeModal(modal);
            }
        }, false
    );
}

function closeModal(modal) {
    document.querySelector(modal).style.display = "none";
}

function showOptions(hide, drpTxt, drpSrc) {
    const shows = document.querySelectorAll('.show');
    const hides = document.querySelectorAll(hide);
    const drpText = document.querySelector('.unique');
    const drpImg = document.getElementById('docProc');

    shows.forEach(function (item) {
        item.style.display = 'none';
        item.setAttribute('class', hide);
    });
    hides.forEach(function (item) {
        item.style.display = 'inline-block';
        item.setAttribute('class', 'show');
    });

    drpText.innerHTML = drpTxt;
    drpImg.setAttribute('src', drpSrc);
}

function showPage(hideElement, page) {
    $(page).show();
    hideElement.forEach(function (e) {
        $(e).hide();
    });
}