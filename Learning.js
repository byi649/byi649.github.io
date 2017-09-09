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

function extractData(name) {
    var api_ID_position = convert_name_to_api_ID(name);
    if (api_ID_position === undefined) {
        alert("This ship doesn't exist!");
        return 0;
    }
    var api_ID = api_ID_position[0];
    var i = api_ID_position[1];
    var rosterX_ID = convert_api_ID_to_rosterX_ID(api_ID);
    if (rosterX_ID[0] === undefined) {
        alert("You don't have this ship!");
        return 0;
    }

    var statistics = get_ship_data(api_ID);
    var fp = statistics[0];
    var tp = statistics[1];
    var nB = statistics[2];
    var hp = statistics[3];
    var ar = statistics[4];
    var ev = statistics[5];
    var aa = statistics[6];
    var asw = get_ship_ASW(rosterX_ID[0]);
    var los = statistics[8];
    var rg = statistics[9];
    var lk = statistics[10];
    var shipClass = statistics[11];

    $('#fp').text(fp);
    $('#tp').text(tp);
    $('#nB').text(nB);
    $('#hp').text(hp);
    $('#ar').text(ar);
    $('#ev').text(ev);
    $('#aa').text(aa);
    $('#asw').text(asw);
    $('#los').text(los);
    switch (rg) {
        case 1:
            $('#rg').text('Short');
            break;
        case 2:
            $('#rg').text('Medium');
            break;
        case 3:
            $('#rg').text('Long');
            break;
        case 4:
            $('#rg').text('Very Long');
            break;
    }
    $('#lk').text(lk);

    var stats_scaling = {
        ship: [fp, tp, hp, aa, nB],
        average: getAverages(shipClass)
    };

    var data = {
        labels: ['FP', 'TP', 'HP', 'AA', 'NB'],
        datasets: [{
            data: scaleStats(stats_scaling),
            backgroundColor: 'rgba(66,134,244,0.3)',
            borderColor: 'rgba(66,134,244,1)'
        }, {
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
                display: false
            }
        }
    });

}
