/**
 * Created by Benjamin on 10/06/2017.
 * This js corresponds to Learning.html
 */

// function getMax(shipClass) {
//     var maxFP = 0;
//     var maxTP = 0;
//     var maxHP = 0;
//     var maxAA = 0;
//     var maxNB = 0;
//     for (var i = 0; i < gameData.length; i++) {
//         if (gameData[i].api_stype === shipClass && gameData[i].api_afterlv === 0) {
//             maxFP = gameData[i].api_houg[1] > maxFP ? gameData[i].api_houg[1] : maxFP;
//             maxTP = gameData[i].api_raig[1] > maxTP ? gameData[i].api_raig[1] : maxTP;
//             maxHP = gameData[i].api_taik[1] > maxHP ? gameData[i].api_taik[1] : maxHP;
//             maxAA = gameData[i].api_tyku[1] > maxAA ? gameData[i].api_tyku[1] : maxAA;
//             maxNB = gameData[i].api_houg[1] + gameData[i].api_raig[1] > maxNB ? gameData[i].api_houg[1] + gameData[i].api_raig[1] : maxNB;
//         }
//     }
//     return [maxFP, maxTP, maxHP, maxAA, maxNB];
// }

function getAverages(shipClass) {
    var totalFP = 0;
    var totalTP = 0;
    var totalHP = 0;
    var totalAA = 0;
    var count = 0;
    for (var i = 0; i < gameData.length; i++) {
        if (gameData[i].api_stype === shipClass && gameData[i].api_afterlv === 0) {
            totalFP += gameData[i].api_houg[1];
            totalTP += gameData[i].api_raig[1];
            totalHP += gameData[i].api_taik[0];
            totalAA += gameData[i].api_tyku[1];
            count++;
        }
    }
    var averageFP = totalFP / count;
    var averageTP = totalTP / count;
    var averageHP = totalHP / count;
    var averageAA = totalAA / count;
    var averageNB = (totalFP + totalTP) / count;
    return [averageFP, averageTP, averageHP, averageAA, averageNB];
}

function scaleStats(stats) {
    var scaled = [];
    for (i = 0; i < stats.ship.length; i++) {
        scaled[i] = stats.ship[i] / stats.average[i];
    }
    return scaled;
}

function extractData(name1, name2) {
    var api_ID_position1 = convert_name_to_api_ID(name1);
    var api_ID_position2 = convert_name_to_api_ID(name2);
    if (api_ID_position1 === undefined) {
        alert("Ship 1 doesn't exist!");
        return 0;
    }
    if (api_ID_position2 === undefined) {
        alert("Ship 2 doesn't exist!");
        return 0;
    }
    var api_ID1 = api_ID_position1[0];
    var i = api_ID_position1[1]; // not actually sure where this is used
    var rosterX_ID1 = convert_api_ID_to_rosterX_ID(api_ID1);
    var api_ID2 = api_ID_position2[0];
    var j = api_ID_position2[1];
    var rosterX_ID2 = convert_api_ID_to_rosterX_ID(api_ID2);
    if (rosterX_ID1[0] === undefined) {
        alert("You don't have ship 1!");
        return 0;
    }
    if (rosterX_ID2[0] === undefined) {
        alert("You don't have ship 2!");
        return 0;
    }

    var statistics1 = get_ship_data(api_ID1);
    var fp1 = statistics1[0];
    var tp1 = statistics1[1];
    var nB1 = statistics1[2];
    var hp1 = statistics1[3];
    var ar1 = statistics1[4];
    var ev1 = statistics1[5];
    var aa1 = statistics1[6];
    var asw1 = get_ship_ASW(rosterX_ID1[0]);
    var los1 = statistics1[8];
    var rg1 = statistics1[9];
    var lk1 = statistics1[10];
    var shipClass1 = statistics1[11];

    var statistics2 = get_ship_data(api_ID2);
    var fp2 = statistics2[0];
    var tp2 = statistics2[1];
    var nB2 = statistics2[2];
    var hp2 = statistics2[3];
    var ar2 = statistics2[4];
    var ev2 = statistics2[5];
    var aa2 = statistics2[6];
    var asw2 = get_ship_ASW(rosterX_ID2[0]);
    var los2 = statistics2[8];
    var rg2 = statistics2[9];
    var lk2 = statistics2[10];
    var shipClass2 = statistics2[11];

    $('#fp1').text(fp1);
    $('#tp1').text(tp1);
    $('#nB1').text(nB1);
    $('#hp1').text(hp1);
    $('#ar1').text(ar1);
    $('#ev1').text(ev1);
    $('#aa1').text(aa1);
    $('#asw1').text(asw1);
    $('#los1').text(los1);
    switch (rg1) {
        case 1:
            $('#rg1').text('Short');
            break;
        case 2:
            $('#rg1').text('Medium');
            break;
        case 3:
            $('#rg1').text('Long');
            break;
        case 4:
            $('#rg1').text('Very Long');
            break;
    }
    $('#lk1').text(lk1);

    $('#fp2').text(fp2);
    $('#tp2').text(tp2);
    $('#nB2').text(nB2);
    $('#hp2').text(hp2);
    $('#ar2').text(ar2);
    $('#ev2').text(ev2);
    $('#aa2').text(aa2);
    $('#asw2').text(asw2);
    $('#los2').text(los2);
    switch (rg2) {
        case 1:
            $('#rg2').text('Short');
            break;
        case 2:
            $('#rg2').text('Medium');
            break;
        case 3:
            $('#rg2').text('Long');
            break;
        case 4:
            $('#rg2').text('Very Long');
            break;
    }
    $('#lk2').text(lk2);

    var stats_scaling1 = {
        ship: [fp1, tp1, hp1, aa1, nB1],
        average: getAverages(shipClass1)
    };

    var stats_scaling2 = {
        ship: [fp2, tp2, hp2, aa2, nB2],
        average: getAverages(shipClass2)
    };

    var data = {
        labels: ['FP', 'TP', 'HP', 'AA', 'NB'],
        datasets: [{
            label: name1,
            data: scaleStats(stats_scaling1),
            backgroundColor: 'rgba(66,134,244,0.3)',
            borderColor: 'rgba(66,134,244,1)'
        }, {
            label: name2,
            data: scaleStats(stats_scaling2),
            backgroundColor: 'rgba(26,191,59,0.3)',
            borderColor: 'rgba(26,191,59,1)'
        }, {
            label: 'Baseline',
            data: [1, 1, 1, 1, 1],
            backgroundColor: 'rgba(0,0,0,0)',
            borderColor: 'rgba(255,0,0,0.6)'
        }]
    };

    var radarChart = new Chart($("#radar"), {
        type: 'radar',
        data: data,
        options: {
            responsive: false,
            scale: {
                ticks: {
                    beginAtZero: true,
                    display: false,
                    max: 1.6
                }
            },
            legend: {
                display: true,
                position: 'right'
            }
        }
    });

}
