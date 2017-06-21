/**
 * Created by Benjamin on 17/06/2017.
 */
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
        if (index === -1) {continue;}
        valueArray[index] = (spec === "api_stype") ? gameData[i][spec]:gameData[i][spec][1];
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

function create_matrix_A() {
    // Example
    // No surplus/slacks yet
    // A = [     Shigure Isuzu Akagi ...
    //      maxShips   [1 1 1 1 1 ...], < maxShips
    //      DD         [1 0 0 0 0 ...], < / > DD
    //      CL         [0 1 0 0 0 ...],
    //      AP         [0 0 100 0 0 ...], > AP
    //      OASW       [1 1 0 0 0 ...], > OASW
    //      Shigure    [1 0 0 0 0 ...], < 1
    //      Isuzu      [0 1 0 0 0 ...], < 1
    // ]

    var matrix_A = new Array(29 + Object.keys(profileData.ships).length).fill([]);
    var classArray = extract_value_from_game('api_stype');
    var count = 0;
    for (var ship in profileData.ships) {
        matrix_A[0].push(1);
        // Maximum
        matrix_A[1].push((classArray[count] === 2) ? 1:0); //DD
        matrix_A[2].push((classArray[count] === 3) ? 1:0); //CL
        matrix_A[3].push((classArray[count] === 4) ? 1:0); //CLT
        matrix_A[4].push((classArray[count] === 5) ? 1:0); //CA
        matrix_A[5].push((classArray[count] === 9) ? 1:0); //BB
        matrix_A[6].push((classArray[count] === 8) ? 1:0); //FBB
        matrix_A[7].push((classArray[count] === 6) ? 1:0); //CAV
        matrix_A[8].push((classArray[count] === 10) ? 1:0); //BBV
        matrix_A[9].push((classArray[count] === 7) ? 1:0); //CVL
        matrix_A[10].push((classArray[count] === 11) ? 1:0); //CV
        matrix_A[11].push((classArray[count] === 13) ? 1:0); //SS
        matrix_A[12].push((classArray[count] === 14) ? 1:0); //SSV
        matrix_A[13].push((classArray[count] === 18) ? 1:0); //CVB
        // Minimum
        matrix_A[14].push((classArray[count] === 2) ? 1:0); //DD
        matrix_A[15].push((classArray[count] === 3) ? 1:0); //CL
        matrix_A[16].push((classArray[count] === 4) ? 1:0); //CLT
        matrix_A[17].push((classArray[count] === 5) ? 1:0); //CA
        matrix_A[18].push((classArray[count] === 9) ? 1:0); //BB
        matrix_A[19].push((classArray[count] === 8) ? 1:0); //FBB
        matrix_A[20].push((classArray[count] === 6) ? 1:0); //CAV
        matrix_A[21].push((classArray[count] === 10) ? 1:0); //BBV
        matrix_A[22].push((classArray[count] === 7) ? 1:0); //CVL
        matrix_A[23].push((classArray[count] === 11) ? 1:0); //CV
        matrix_A[24].push((classArray[count] === 13) ? 1:0); //SS
        matrix_A[25].push((classArray[count] === 14) ? 1:0); //SSV
        matrix_A[26].push((classArray[count] === 18) ? 1:0); //CVB
        // Fleet specific
        matrix_A[27].push((classArray[count] === 7 || classArray[count] === 11 || classArray[count] === 18) ? calculate_air_power(ship) : 0); //AP
        matrix_A[28].push((get_ship_ASW(ship) >= 70) ? 1:0); //OASW
        count++;
    }
    var counter = 0;
    var end = matrix_A.length;
    //Individual ship limit
    for (var yomi in profileData.ships) {
        matrix_A[end + counter] = new Array(matrix_A[0].length).fill(0);
        matrix_A[end + counter][counter] = 1;
        counter++;
    }
    return matrix_A;
}

function make_slacks(matrix, rows) {
    var col_end = matrix[0].length;
    // Append zeros to all rows in matrix
    for (var i = 0; i < matrix.length; i++) {
        var zeroArray = new Array(rows.length).fill(0);
        matrix[i].push(zeroArray)
    }
    // Edit 1 in for specific rows in a format similar to identity matrix
    var k = 0;
    for (var j = 0; i < rows.length; i++) {
        var rowNumber = rows[j];
        matrix[rowNumber][col_end + k] = 1;
        k++;
    }
    return matrix;
}

function make_surplus(matrix, rows) {
    var col_end = matrix[0].length;
    // Append zeros to all rows in matrix
    for (var i = 0; i < matrix.length; i++) {
        var zeroArray = new Array(rows.length).fill(0);
        matrix[i].push(zeroArray)
    }
    // Edit 1 in for specific rows in a format similar to identity matrix
    var k = 0;
    for (var j = 0; j < rows.length; j++) {
        var rowNumber = rows[j];
        matrix[rowNumber][col_end + k] = -1;
        k++;
    }
    return matrix;
}

function complete_matrix_A(matrix_A) {
    // Example
    // A = [     Shigure Isuzu Akagi ...
    //      maxShips   [1 1 1 1 1 ... 1 0 0 0], < maxShips
    //      DD         [1 0 0 0 0 ... 0 1 0 0], < DD
    //      CL         [0 1 0 0 0 ... 0 0 1 0], < CL
    //      DD         [1 0 0 0 0 ... 0 0 0 -1], > DD
    //      AP         [0 0 X 0 0 ... 0 0 0 0 -1], > AP
    //      OASW       [1 1 0 0 0 ... 0 0 0 0 0 -1], > OASW
    //      Shigure    [1 0 0 0 0 ... 0 0 0 0 0 0 1], < 1
    //      Isuzu      [0 1 0 0 0 ... 0 0 0 0 0 0 0 1], < 1
    // ]

    var slack_rows = [];
    for (var i = 1; i <= 13; i++) {
        slack_rows.push(i);
    }
    for (var j = 29; j < matrix_A.length; j++) {
        slack_rows.push(j);
    }
    matrix_A = make_slacks(matrix_A, slack_rows);

    var surplus_rows = [];
    for (var l = 14; l <= 28; l++) {
        slack_rows.push(l);
    }
    matrix_A = make_surplus(matrix_A, surplus_rows);

    return matrix_A;
}

function create_vector_b(matrix_A, maxShips, minFighter, minOASW, minClass, maxClass) {
    vector_b = new Array(matrix_A.length).fill(0);
    // Maximum number of ships
    vector_b[0] = maxShips;
    // Minimum class requirements
    for (var i = 0; i < minClass.length; i++) {
        vector_b[1 + i] = minClass[i];
    }
    // Maximum class requirements
    for (var j = 0; j < maxClass.length; j++) {
        vector_b[14 + j] = maxClass[j];
    }
    vector_b[27] = minFighter;
    vector_b[28] = minOASW;
    // Individual ship limit
    for (var k = 29; k < vector_b.length; k++) {
        vector_b[k] = 1;
    }
    return vector_b;
}

function create_cost_vector(obj) {
    return extract_value_from_profile(obj);
}

function solve_model(obj, maxShips, minFighter, minOASW, minClass, maxClass) {
    var incomplete = create_matrix_A();
    var matrix_A = complete_matrix_A(incomplete);
    var vector_b = create_vector_b(matrix_A, maxShips, minFighter, minOASW, minClass, maxClass);
    var vector_c = create_cost_vector(obj);
    var model = {
        "A" : matrix_A,
        "b" : vector_b,
        "c" : vector_c,
        "m" : matrix_A.length,
        "n" : matrix_A[0].length,
        "xLB" : new Array(matrix_A.length).fill(0),
        "xUB" : new Array(matrix_A.length).fill(1),
        "xINT" : new Array(matrix_A.length).fill(false)
    };
    SimplexJS.PrimalSimplex(model);
    alert(model);
}