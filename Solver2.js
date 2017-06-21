/**
 * Created by Benjamin on 12/06/2017.
 * This js corresponds to Solver.html
 */
// var solver = require("lpsolver/src/solver.js");
var results;

// $('.tableConstraints').change(function() {
//     $(".min").filter(function(){
//         return $(this.value) === "0";
//     }).css({color: "red"});
// });
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
    $("#constraints")[0].reset();
    $("#constraints .min, #constraints .max").css({color: "#D3D3D3"});
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
    for (var i = 0; i < profileData.ships[xID].slots.length; i++) {
        fighter_power += Math.floor(Math.sqrt(profileData.ships[xID].slots[i]) * 10 + 25);
    }
    return fighter_power;
}

function create_variables(obj) {
    var vary = {};
    var count = 0;
    var objArray = extract_value_from_profile(obj); //Known bug: Night battle + fighter power >= 314 will crash.
    var classArray = extract_value_from_game('api_stype');
    // TODO: more comprehensively ignore stats (eg OASW to ignore battle stats)
    // if (obj === "yasen" || obj === "yasenCI") {
    //     for (var i = 0; i < objArray.length; i++) {
    //         objArray[i] = (classArray[i] === 7 || classArray[i] === 11 || classArray[i] === 18) ? i * 30 / objArray.length : objArray[i]; //I know.
    //     }
    // }
    for (var prop in profileData.ships) {
        vary[prop] = {
            "maxShips": 1,
            "obj": objArray[count],
            "DD": (classArray[count] === 2) ? 1 : 0,
            "CL": (classArray[count] === 3) ? 1 : 0,
            "CLT": (classArray[count] === 4) ? 1 : 0,
            "CA": (classArray[count] === 5) ? 1 : 0,
            "BB": (classArray[count] === 9) ? 1 : 0,
            "FBB": (classArray[count] === 8) ? 1 : 0,
            "CAV": (classArray[count] === 6) ? 1 : 0,
            "BBV": (classArray[count] === 10) ? 1 : 0,
            "CVL": (classArray[count] === 7) ? 1 : 0,
            "CV": (classArray[count] === 11) ? 1 : 0,
            "SS": (classArray[count] === 13) ? 1 : 0,
            "SSV": (classArray[count] === 14) ? 1 : 0,
            "CVB": (classArray[count] === 18) ? 1 : 0,
            "AP": (classArray[count] === 7 || classArray[count] === 11 || classArray[count] === 18) ? calculate_air_power(prop) : 0,
            "OASW": (get_ship_ASW(prop) >= 70) ? 1 : 0 //TODO: AACI
        };
        yomi = convert_rosterX_ID_to_yomi(prop);
        vary[prop][yomi] = 1;
        count++;
    }
    return vary;
}

function create_constraints(maxShips, minFighter, minOASW, minClass, maxClass) {
    var minCarrier = (minFighter >= 314) ? 2 : 0;
    var constraints = {
        "maxShips": {
            "max": maxShips
        },
        "DD": {
            "min": minClass[0],
            "max": maxClass[0]
        },
        "CL": {
            "min": minClass[1],
            "max": maxClass[1]
        },
        "CLT": {
            "min": minClass[2],
            "max": maxClass[2]
        },
        "CA": {
            "min": minClass[3],
            "max": maxClass[3]
        },
        "BB": {
            "min": minClass[4],
            "max": maxClass[4]
        },
        "FBB": {
            "min": minClass[5],
            "max": maxClass[5]
        },
        "CAV": {
            "min": minClass[6],
            "max": maxClass[6]
        },
        "BBV": {
            "min": minClass[7],
            "max": maxClass[7]
        },
        "CVL": {
            "min": minClass[8],
            "max": maxClass[8]
        },
        "CV": {
            "min": minClass[9],
            "max": maxClass[9]
        },
        "SS": {
            "min": minClass[10],
            "max": maxClass[10]
        },
        "SSV": {
            "min": minClass[11],
            "max": maxClass[11]
        },
        "CVB": {
            "min": minClass[12],
            "max": maxClass[12]
        },
        "OASW": {
            "min": minOASW
        },
        "AP": {
            "min": minFighter
        }
    };
    for (var prop in profileData.ships) {
        yomi = convert_rosterX_ID_to_yomi(prop);
        constraints[yomi] = {
            "max": 1
        };
    }
    return constraints;
}

function init_model(obj, maxShips, minFighter, minOASW, minClass, maxClass) {
    var model = {
        "optimize": "obj",
        "opType": "max",
        "constraints": create_constraints(maxShips, minFighter, minOASW, minClass, maxClass),
        "variables": create_variables(obj),
        "ints": {},
        "tolerance": 20 // Because fuck CV
    };
    for (var prop in profileData.ships) {
        model.ints[prop] = 1;
    }
    return model;
}

function solve_model(obj, maxShips, minFighter, minOASW, minClass, maxClass) {
    var model = init_model(obj, maxShips, minFighter, minOASW, minClass, maxClass);
    // model = solver.ReformatLP(model);
    // model = solver.ReformatLP(model); // I don't know why I need to format twice, but okay.
    results = solver.Solve(model);
    return results;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function english_model(obj, maxShips, minFighter, minOASW, minClass, maxClass) {
    var result = solve_model(obj, maxShips, minFighter, minOASW, minClass, maxClass);
    var list_of_ships = [];
    var list_of_ships_kanji = [];
    var temporary_name;
    var i = 0;
    for (var prop in result) {
        if (prop === 'feasible' || prop === 'result' || prop === 'bounded' || result[prop] === 0) {
        } else {
            list_of_ships[i] = profileData.ships[prop].masterId;
            temporary_name = convert_api_ID_to_yomi(list_of_ships[i])[0];
            list_of_ships_kanji[i] = convert_api_ID_to_name(list_of_ships[i])[0];
            list_of_ships[i] = (wanakana.isHiragana(temporary_name)) ? wanakana.toRomaji(temporary_name) : list_of_ships_kanji[i];
            list_of_ships[i] = (wanakana.isHiragana(temporary_name)) ? capitalizeFirstLetter(list_of_ships[i]) : list_of_ships[i].replace(/[\u0250-\ue007]/g, '');
            i++;
        }
    }
    // $('#solution').text(list_of_ships.join(', '));
    return [list_of_ships, list_of_ships_kanji, result.feasible];
}

function generate_table(obj, maxShips, minFighter, minOASW, minClass, maxClass) {
    [list_of_ships, list_of_ships_kanji, feasibility] = english_model(obj, maxShips, minFighter, minOASW, minClass, maxClass);
    if (feasibility === false) {
        $('#showFeasible').text("Constraints are infeasible");
        $('#right').css({visibility: "hidden"});
        return;
    }
    var table = "<table>";
    for (i = 0; i < list_of_ships.length; i++) {
        table += "<tr><td> Ship " + (i + 1) + "</td><td>" + list_of_ships_kanji[i] + "</td><td>" + list_of_ships[i] + "</td></tr>";
    }
    table += "</table>";
    $('#solution').html(table);
    $('#showFeasible').text("");
    $('#right').css({visibility: "visible"})
}