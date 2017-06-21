/**
 * Created by Benjamin on 20/06/2017.
 */


$(document).ready(function () {
    $('#allmodels').on('change', function() {
        $('.min').filter(function() {
            return Number($(this).val()) === 0;
        }).css({color: "#D3D3D3"});
        $('.min').filter(function() {
            return !(Number($(this).val()) === 0);
        }).css({color: "#000000"});
        $('.max').filter(function() {
            return Number($(this).val()) === 6;
        }).css({color: "#D3D3D3"});
        $('.max').filter(function() {
            return !(Number($(this).val()) === 6);
        }).css({color: "#000000"});
    })
});

function reset_form() {
    $(".constraints")[0].reset();
    $(".constraints .min, .constraints .max").css({color: "#D3D3D3"});
    $('#right').css({visibility: "hidden"});
    $('#showFeasible').text("");
}

var numFleet = 1;

$(document).ready(function () {

    var subpage = $('#Fleet1')[0].innerHTML;


    // Add fleet button
    $('#addFleet').click(function () {
        // Update sidebar and numFleet
        var sidebar_list = $('#sidebarItems')[0].innerHTML;
        numFleet++;
        var new_list_item = document.createElement("LI");
        new_list_item.setAttribute("id", "Select fleet " + numFleet + " sidebar");
        new_list_item.innerHTML = "Fleet " + numFleet;
        $('#sidebarItems')[0].appendChild(new_list_item);
        // Generate new fleet page
        var new_page = document.createElement("DIV");
        new_page.id = "Fleet" + numFleet;
        new_page.className = "inputform";
        new_page.innerHTML = subpage.replace(/1/g, numFleet);
        new_page.style.display = "none";
        $('#allmodels')[0].appendChild(new_page);
    });

    // Fleet buttons
    $("#sidebarItems").on('click', "[id^='Select fleet']", function(){
        // Hide all
        $("[id^='Fleet']").css( "display", "none" );
        $("[id^='Select']").each(function() {
            $(this).attr('class', '')
        });
        // Show clicked
        var fleetID = $(this)[0].innerHTML.slice(-1);
        $("[id='Fleet" + fleetID + "']").css( "display", "" );
        $("[id='Select fleet " + fleetID + " sidebar']")[0].className = "active";
    });

});

function extract_value_from_profile(value) {
    var valueArray = [];
    var index = 0;
    if (value === "as") {
        for (var prop in profileData.ships) {
            valueArray[index] = get_ship_ASW(prop);
            index++;
        }
    } else {
        for (var prop in profileData.ships) {
            if (value === "yasenCI") {
                valueArray[index] = (profileData.ships[prop].lk[0] >= 40) ? (profileData.ships[prop].fp[1] + profileData.ships[prop].tp[1]) * 1.25 : profileData.ships[prop].fp[1] + profileData.ships[prop].tp[1];
            } else if (value === "yasen") {
                valueArray[index] = profileData.ships[prop].fp[1] + profileData.ships[prop].tp[1];
            } else {
                valueArray[index] = profileData.ships[prop][value][1];
            }
            index++;
        }
    }
    return valueArray;
}

function extract_value_from_game(spec) {
    clean_game_Data();
    var index;
    var valueArray = [];
    for (var i = 0; i < gameData.length; i++) {
        index = convert_api_ID_to_rosterX_ID(gameData[i].api_id)[1];
        if (index === -1) {
            continue;
        }
        valueArray[index] = (spec === "api_stype") ? gameData[i][spec] : gameData[i][spec][1];
    }
    return valueArray;
}

function calculate_air_power(xID) {
    var fighter_power = 0;
    // Intentionally do not count first slot - use for torpedo bomber or something
    // Assuming reppuu in all other slots
    for (var i = 1; i < profileData.ships[xID].slots.length; i++) {
        fighter_power += Math.floor(Math.sqrt(profileData.ships[xID].slots[i]) * 10 + 25);
    }
    return fighter_power;
}

// Assume obj = [obj1, obj2 ...]
// Assume numFleet = scalar
function create_variables_multiple(obj, numFleet) {
    var vary = {};
    var count = 0;
    var objArray = {};
    for (var j = 0; j < numFleet; j++) {
        objArray[j] = extract_value_from_profile(obj[j]);
    }
    var aaArray = extract_value_from_profile("aa"); // For AACI
    var classArray = extract_value_from_game('api_stype');
    for (var prop in profileData.ships) {
        for (var l = 0; l < numFleet; l++) {
            vary[l + prop] = {};
        }
    }
    for (var prop in profileData.ships) {
        for (var i = 0; i < numFleet; i++) {
            vary[i + prop][i + "maxShips"] = 1;
            vary[i + prop][i + "AP"] = (classArray[count] === 7 || classArray[count] === 11 || classArray[count] === 18) ? calculate_air_power(prop) : 0;
            vary[i + prop][i + "OASW"] = (get_ship_ASW(prop) >= 70) ? 1 : 0;
            vary[i + prop][i + "AACI"] = (aaArray[count] >= 106 && classArray[count] !== 8) ? 1 : 0;
            vary[i + prop]["obj"] = objArray[i][count];
            // Class restriction
            vary[i + prop][i + "Class #" + classArray[count]] = 1;
            // Individual ship restriction
            yomi = convert_rosterX_ID_to_yomi(prop);
            vary[i + prop][yomi] = 1;
        }
        count++;
    }
    return vary;
}

// Assume maxShips = [maxShips1, maxShips2 ...] and so on
// Assume minClass = [ [0,0, ...], [0,0, ...], ... ] and so on
function create_constraints_multiple(maxShips, minFighter, minOASW, minAACI, minClass, maxClass, numFleet) {
    var constraints = {};
    for (var i = 0; i < numFleet; i++) {
        constraints[i + "maxShips"] = {
            "max": maxShips[i]
        };
        constraints[i + "OASW"] = {
            "min": minOASW[i]
        };
        constraints[i + "AP"] = {
            "min": minFighter[i]
        };
        constraints[i + "AACI"] = {
            "min": minAACI[i]
        };

        for (var j = 1; j <= 22; j++) {
            constraints[i + "Class #" + j] = {
                "min": minClass[i][j-1],
                "max": maxClass[i][j-1]
            };
        }
    }

    for (var prop in profileData.ships) {
        yomi = convert_rosterX_ID_to_yomi(prop);
        constraints[yomi] = {
            "max": 1
        };
    }
    return constraints;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function solve_model() {
    var obj = [];
    var maxShips = [];
    var minFighter = [];
    var minOASW = [];
    var minAACI = [];
    var minClass = new Array(numFleet);
    var maxClass = new Array(numFleet);
    for (var fleetN = 0; fleetN < numFleet; fleetN ++) {
        minClass[fleetN] = [];
        maxClass[fleetN] = [];
    }

    for (var fleet = 1; fleet <= numFleet; fleet++) {
        var minarrayIndex = 0;
        var maxarrayIndex = 0;
        obj[fleet-1] = $("[name= objective" + fleet + "]").val();
        maxShips[fleet-1] = $("[name= maxShips" + fleet + "]").val();
        minFighter[fleet-1] = $("[name= minFighter" + fleet + "]").val();
        minOASW[fleet-1] = $("[name= minOASW" + fleet + "]").val();
        minAACI[fleet-1] = $("[name= minAACI" + fleet + "]").val();

        minClass[fleet-1] = new Array(22).fill(0);
        $(".min").each(function(index) {
            var selected = $(this);
            if (Number($(this)[0].name.slice(-1)) === fleet) {
                minClass[fleet-1][minarrayIndex] = selected.val();
                minarrayIndex++;
            }
        });

        maxClass[fleet-1] = new Array(22).fill(6);
        $(".max").each(function(index) {
            var selected = $(this);
            if (Number($(this)[0].name.slice(-1)) === fleet) {
                maxClass[fleet-1][maxarrayIndex] = selected.val();
                maxarrayIndex++;
            }
        });
    }

    var model = {
        "optimize": "obj",
        "opType": "max",
        "constraints": create_constraints_multiple(maxShips, minFighter, minOASW, minAACI, minClass, maxClass, numFleet),
        "variables": create_variables_multiple(obj, numFleet),
        "ints": {},
        "tolerance": 20 // Because fuck CV
    };
    for (var i = 0; i < numFleet; i++) {
        for (var prop in profileData.ships) {
            model.ints[i + prop] = 1;
        }
    }
    results = solver.Solve(model);
    // alert(Object.keys(results));

    // Translate results
    var list_of_ships = new Array(numFleet);
    var list_of_ships_kanji = new Array(numFleet);
    var temporary_name = new Array(numFleet).fill([]);

    for (fleetN = 0; fleetN < numFleet; fleetN++) {
        list_of_ships[fleetN] = [];
        list_of_ships_kanji[fleetN] = [];
    }

    for (var k = 0; k < numFleet; k++) {
        var j = 0;
        for (var prop in results) {
            if (prop === 'feasible' || prop === 'result' || prop === 'bounded' || results[prop] === 0) {
            } else {
                if (Number(prop.charAt(0)) === k) {
                    list_of_ships[k][j] = profileData.ships[prop.slice(1)].masterId;
                    temporary_name[k] = convert_api_ID_to_yomi(list_of_ships[k][j])[0];
                    list_of_ships_kanji[k][j] = convert_api_ID_to_name(list_of_ships[k][j])[0];
                    list_of_ships[k][j] = (wanakana.isHiragana(temporary_name[k])) ? wanakana.toRomaji(temporary_name[k]) : list_of_ships_kanji[k][j];
                    list_of_ships[k][j] = (wanakana.isHiragana(temporary_name[k])) ? capitalizeFirstLetter(list_of_ships[k][j]) : list_of_ships[k][j].replace(/[\u0250-\ue007]/g, '');
                    j++;
                }
            }
        }
    }
    // Display results
    if (results.feasible === false) {
        $('#showFeasible').text("Constraints are infeasible");
        $('#right').css({visibility: "hidden"});
        return;
    }
    var table = "";
    for (k = 0; k < numFleet; k++) {
        table += "Fleet " + (k + 1) + " - " + obj[k] + "<table>";
        for (i = 0; i < list_of_ships[k].length; i++) {
            table += "<tr><td> Ship " + (i + 1) + "</td><td>" + list_of_ships_kanji[k][i] + "</td><td>" + list_of_ships[k][i] + "</td></tr>";
        }
        table += "</table> <br>";
    }

    $('#solution').html(table);
    $('#showFeasible').text("");
    $('#right').css({visibility: "visible"})
}