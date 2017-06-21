/**
 * Created by Benjamin on 12/06/2017.
 * This js corresponds to Solver.html
 */
// var solver = require("lpsolver/src/solver.js");
var results;

function extract_value_from_profile(value) {
    var valueArray = [];
    var index = 0;
    for (var prop in profileData.ships) {
        valueArray[index] = profileData.ships[prop][value][0];
        index++;
    }
    return valueArray;
}

function extract_value_from_game(spec) {
    clean_game_Data();
    var index;
    var valueArray = [];
    for (var i = 0; i < gameData.length; i++) {
        index = convert_api_ID_to_rosterX_ID(gameData[i].api_id)[1];
        if (index === -1) {continue;}
        valueArray[index] = gameData[i][spec][1];
    }
    return valueArray;
}

function one_five_variables() {
    var vary = {};
    var count = 0;
    var asw = extract_value_from_profile('as');
    for (var prop in profileData.ships) {
        vary[prop] = {
            "maxShips": 1,
            "asw": asw[count],
            prop: 1,
            "CVL": (gameData[convert_api_ID_to_name(profileData.ships[prop].masterId)[1]].api_stype === 7) ? 1 : 0
        };
        count++;
    }
    return vary;
}

function two_four_variables() {
    var vary = {};
    var count = 0;
    var fp = extract_value_from_game("api_houg");
    for (var prop in profileData.ships) {
        vary[prop] = {
            "maxShips": 1,
            "fp": fp[count],
            prop: 1
        };
        count++;
    }
    return vary;
}

function one_five_constraints() {
    var constraints = {
        "maxShips": {
            "equal": 4
        },
        "CVL": {
            "min": 1
        }
    };
    for (var prop in profileData.ships) {
        constraints[prop] = {
            "max": 1
        };
    }
    return constraints;
}

function two_four_constraints() {
    var constraints = {
        "maxShips": {
            "max": 6
        }
    };
    for (var prop in profileData.ships) {
        constraints[prop] = {
            "max": 1
        };
    }
    return constraints;
}

function init_model() {
    var model = {
        "optimize": "asw",
        "opType": "max",
        "constraints": one_five_constraints(),
        "variables": one_five_variables(),
        "ints": {}
    };
    for (var prop in profileData.ships) {
        model.ints[prop] = 1;
    }
    return model;
}

function solve_model() {
    var model = init_model();
    model = solver.ReformatLP(model);
    model = solver.ReformatLP(model); // I don't know why I need to format twice, but okay.
    results = solver.Solve(model);
    return results;
}

function english_model() {
    var result = solve_model();
    var list_of_ships = [];
    var i = 0;
    for (var prop in result) {
        if (prop === 'feasible' || prop === 'result' || prop === 'bounded' ) {
        } else {
            list_of_ships[i] = profileData.ships[prop].masterId;
            list_of_ships[i] = convert_api_ID_to_name(list_of_ships[i])[0];
            i++;
        }
    }
    $('#solution').text(list_of_ships.join(', '));
}
