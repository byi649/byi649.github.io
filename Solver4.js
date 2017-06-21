/**
 * Created by Benjamin on 20/06/2017.
 */

$(document).ready(function () {

    $('.min').change(function () {
        $('.min').filter(function () {
            return Number($(this).val()) === 0;
        }).css({color: "#D3D3D3"});
        $('.min').filter(function () {
            return !(Number($(this).val()) === 0);
        }).css({color: "#000000"});
    });

    $('.max').change(function () {
        $('.max').filter(function () {
            return Number($(this).val()) === 6;
        }).css({color: "#D3D3D3"});
        $('.max').filter(function () {
            return !(Number($(this).val()) === 6);
        }).css({color: "#000000"});
    });

});

function reset_form() {
    $(".constraints")[0].reset();
    $(".constraints .min, .constraints .max").css({color: "#D3D3D3"});
    $('#right').css({visibility: "hidden"});
    $('#showFeasible').text("");
}

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

function create_variables(obj) {
    var vary = {};
    var count = 0;
    var objArray = extract_value_from_profile(obj);
    var aaArray = extract_value_from_profile("aa"); // For AACI
    var classArray = extract_value_from_game('api_stype');
    for (var prop in profileData.ships) {
        vary[prop] = {
            "maxShips": 1,
            "obj": objArray[count],
            "AP": (classArray[count] === 7 || classArray[count] === 11 || classArray[count] === 18) ? calculate_air_power(prop) : 0,
            "OASW": (get_ship_ASW(prop) >= 70) ? 1 : 0,
            "AACI": (aaArray[count] >= 106 && classArray[count] !== 8) ? 1 : 0
        };
        // Class restriction
        vary[prop]["Class #" + classArray[count]] = 1;
        // Individual ship restriction
        yomi = convert_rosterX_ID_to_yomi(prop);
        vary[prop][yomi] = 1;
        count++;
    }
    return vary;
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

function create_constraints(maxShips, minFighter, minOASW, minAACI, minClass, maxClass) {
    var constraints = {
        "maxShips": {
            "max": maxShips
        },
        "OASW": {
            "min": minOASW
        },
        "AP": {
            "min": minFighter
        },
        "AACI": {
            "min": minAACI
        }
    };
    for (var i = 1; i <= 22; i++) {
        constraints["Class #" + i] = {
            "min": minClass[i-1],
            "max": maxClass[i-1]
        };
    }
    for (var prop in profileData.ships) {
        yomi = convert_rosterX_ID_to_yomi(prop);
        constraints[yomi] = {
            "max": 1
        };
    }
    return constraints;
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

function solve_model(obj, maxShips, minFighter, minOASW, minAACI, minClass, maxClass, numFleet) {
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
    var list_of_ships = [];
    var list_of_ships_kanji = [];
    var list_of_ships2 = [];
    var list_of_ships_kanji2 = [];
    var temporary_name;
    var j = 0;
    var k = 0;
    for (var prop in results) {
        if (prop === 'feasible' || prop === 'result' || prop === 'bounded' || results[prop] === 0) {
        } else {
            if (prop.charAt(0) === "0") {
                list_of_ships[j] = profileData.ships[prop.slice(1)].masterId;
                temporary_name = convert_api_ID_to_yomi(list_of_ships[j])[0];
                list_of_ships_kanji[j] = convert_api_ID_to_name(list_of_ships[j])[0];
                list_of_ships[j] = (wanakana.isHiragana(temporary_name)) ? wanakana.toRomaji(temporary_name) : list_of_ships_kanji[j];
                list_of_ships[j] = (wanakana.isHiragana(temporary_name)) ? capitalizeFirstLetter(list_of_ships[j]) : list_of_ships[j].replace(/[\u0250-\ue007]/g, '');
                j++;
            } else {
                list_of_ships2[k] = profileData.ships[prop.slice(1)].masterId;
                temporary_name = convert_api_ID_to_yomi(list_of_ships2[k])[0];
                list_of_ships_kanji2[k] = convert_api_ID_to_name(list_of_ships2[k])[0];
                list_of_ships2[k] = (wanakana.isHiragana(temporary_name)) ? wanakana.toRomaji(temporary_name) : list_of_ships_kanji2[k];
                list_of_ships2[k] = (wanakana.isHiragana(temporary_name)) ? capitalizeFirstLetter(list_of_ships2[k]) : list_of_ships2[k].replace(/[\u0250-\ue007]/g, '');
                k++;
            }
        }
    }
    // Display results
    if (results.feasible === false) {
        $('#showFeasible').text("Constraints are infeasible");
        $('#right').css({visibility: "hidden"});
        return;
    }
    var table = "<table>";
    for (i = 0; i < list_of_ships.length; i++) {
        table += "<tr><td> Ship " + (i + 1) + "</td><td>" + list_of_ships_kanji[i] + "</td><td>" + list_of_ships[i] + "</td></tr>";
    }
    table += "<tr><td> Fleet 2 </td><td> ~ </td><td> ~ </td></tr>";
    for (i = 0; i < list_of_ships2.length; i++) {
        table += "<tr><td> Ship " + (i + 1) + "</td><td>" + list_of_ships_kanji2[i] + "</td><td>" + list_of_ships2[i] + "</td></tr>";
    }
    table += "</table>";
    $('#solution').html(table);
    $('#showFeasible').text("");
    $('#right').css({visibility: "visible"})
}