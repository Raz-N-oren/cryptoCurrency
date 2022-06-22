/// <reference path="jquery-3.4.1.js" />

(function () { // IIFE

    $(function () {

        let cachedCoinsArray = [];
        let temporaryMoreCoinInfoMap = new Map();
        let moreInfoOpen = new Set();
        let toggledCoins = new Set();
        let isModalOpen = false;
        let chartIntervalId;

        let url = `https://api.coingecko.com/api/v3/coins`;
        $.get(url).then(function (coinsArray) {
            $("#loader").hide();
            $("#charts-div-container").empty().hide();
            initCoinsCache(coinsArray);
            addCoinsToUI(cachedCoinsArray);
        })
            .catch(function (error) {
                console.log(error);
                alert("Failed to get coins data");
            });

        $("#searchCoin").keyup(function (event) {
            if (event.keyCode === 13) {
                $("#showCoin").click();
            }
        });

        $("#showCoin").click(function () {
            let userCoinSearched = $("#searchCoin").val();
            let filteredCoins = cachedCoinsArray.filter(function (coin) {
                return coin.symbol.toLowerCase().includes(userCoinSearched.toLowerCase()) || coin.name.toLowerCase().includes(userCoinSearched.toLowerCase());
            })

            if (filteredCoins.length == 0) {
                alert("Coin wasn't found");
                $("#searchCoin").val("");
            }

            else {
                clearHtml();
                $('.parallax').show();
                $('.coins-container').show();
                $("#back-to-top-div").show();
                addCoinsToUI(filteredCoins);
                $("#searchCoin").val("");
            }
        });

        $("#about").click(onAddAboutContainerToUiClicked);

        $("#home").click(onAddHomePageContainerToUiCliked);
        $("#navbar-title").click(onAddHomePageContainerToUiCliked);

        $("#live-report").on("click", function () {
            if (toggledCoins.size == 0) {
                alert("Please choose 1-5 coins");
            }

            else {
                clearHtml();
                $("#charts-div-container").show();
                let chartsContainerElement = `<div id="chartContainer" style="height: 320px; width: 100%;"></div>`
                $("#charts-div-container").append(chartsContainerElement);
                showLiveReports();
            }
        });

        function initCoinsCache(coins) {
            for (let index = 0; index < coins.length; index++) {
                cachedCoinsArray.push(coins[index]);
            }
        }

        function addCoinsToUI(coins) {
            for (let coin of coins) {
                let coinCard =
                    `<div id="${coin.id}Div" class="coin-card">
                <div id="${coin.id}Title" class="card-title form-switch"></div>
                <div class="coin-symbol">${coin.symbol}<br></div>
                <div class="coin-name">${coin.name}  <img src=${coin.image.thumb}> </div>
                <button class="more-info-btn" id="${coin.id}Button">More Info</button>
                <div id="${coin.id}infoDiv"></div>
                </div>`;

                let liveReportSwitch = $(`<input class="form-check-input" id="${coin.id}Switch" type="checkbox">`);

                $(liveReportSwitch).on("click", function () {
                    liveReportSwitchToggled(coin, `${coin.id}Switch`);
                })

                $(".coins-container").append(coinCard);
                $(`#${coin.id}Title`).append(liveReportSwitch);
                $(`#${coin.id}Button`).click(function () {
                    getMoreInfo(coin)
                });

                if (toggledCoins.has(coin)) {
                    $(liveReportSwitch).prop("checked", true);
                }

                if (moreInfoOpen.has(coin.id)) {
                    addMoreInfoToUi(coin, temporaryMoreCoinInfoMap.get(coin.id));
                }
            }
        }

        function liveReportSwitchToggled(coin, switchId) {
            if (toggledCoins.size < 5 && !toggledCoins.has(coin)) {
                toggledCoins.add(coin);
            }

            else {
                if (toggledCoins.has(coin)) {
                    toggledCoins.delete(coin);
                    $(`#${switchId}`).prop("checked", false);
                }

                if (toggledCoins.size == 5) {
                    if (!isModalOpen) {
                        openModal(coin);
                    }

                    else {
                        alert("Please note that only 5 coins are allowed.");

                    }

                    $(`#${switchId}`).prop("checked", false);
                }
            }
        }

        function openModal(coin) {
            isModalOpen = true;
            $("#modalBody").html("");
            $("#modalFooter").html("");
            for (let item of toggledCoins) {
                addCoinToModal(item, "modalBody");
            }
            addCoinToModal(coin, "modalFooter")

            $("#coinSwitchModal").modal("toggle");

            $("#modalCloseButton").on("click", function () {
                isModalOpen = false;
                $('.coins-container').html("");
                addCoinsToUI(cachedCoinsArray);
            });
        }

        function addCoinToModal(coin, targetDivId) {
            let coinDiv = $(`<div class="modal-coin form-switch"><img src=${coin.image.thumb}>  ${coin.name}</div>`);
            let coinSwitch = $(`<input class="form-check-input" id="${coin.id}ModalSwitch" checked type="checkbox">`);
            $(coinSwitch).on("click", function () {
                liveReportSwitchToggled(coin, `${coin.id}ModalSwitch`);
            })
            coinDiv.append(coinSwitch);
            $(`#${targetDivId}`).append(coinDiv);

            if (toggledCoins.has(coin)) {
                $(`#${coin.id}ModalSwitch`).prop("checked", true);
            }

            else {
                $(`#${coin.id}ModalSwitch`).prop("checked", false);
            }
        }

        function getMoreInfo(coin) {
            let coinMoreInfoDiv = $(`#${coin.id}infoDiv`);
            let loaderDiv = $(`<div id="loader" class="moreinfo-div-loader"><img class="moreinfo-img-loader" src="imgs/loading copy.gif"></div>`);
            coinMoreInfoDiv.append(loaderDiv);

            if (isMoreInfoOpen(coin.id)) {
                loaderDiv.remove();
                moreInfoOpen.delete(coin.id);
                $(`#${coin.id}infoDiv`).empty().hide();
                $(`#${coin.id}Button`).html('More Info');
            }

            else {
                moreInfoOpen.add(coin.id);

                let url = `https://api.coingecko.com/api/v3/coins/${coin.id}`;

                $.get(url).then(function (coinInfo) {
                    loaderDiv.remove();
                    temporaryMoreCoinInfoMap.set(coin.id, coin);
                    saveMoreInfoToCache(coinInfo);
                    addMoreInfoToUi(coin, coinInfo);
                    $(`#${coin.id}infoDiv`).show();


                });
            }
        };

        function addMoreInfoToUi(coin, coinInfo) {

            let ils = coinInfo.market_data.current_price.ils;
            let usd = coinInfo.market_data.current_price.usd;
            let eur = coinInfo.market_data.current_price.eur;

            let moreInfoDiv =
                `<div class="more-info-div">
                    <div class="more-price-div">
                    <strong>ILS:</strong> ${ils} ₪ <br>
                    <strong>USD:</strong> ${usd} $ <br>
                    <strong>EUR:</strong> ${eur} € </div>
                    </div>`
            $(`#${coin.id}infoDiv`).append(moreInfoDiv);
            $(`#${coin.id}Button`).html('Less Info')
        }

        function saveMoreInfoToCache(coin) {
            temporaryMoreCoinInfoMap.set(coin.id, coin);
            setTimeout(function () {
                temporaryMoreCoinInfoMap.delete(coin.id)
            }, 120000);
        }

        function isMoreInfoOpen(id) {
            if (moreInfoOpen.has(id)) {
                return true;
            }
            return false;
        }

        function onAddAboutContainerToUiClicked() {
            clearHtml();
            let about =

                `<div class="flip-card-container">
                <div class="flip-card">
                <div class="flip-card-inner">
                    <div class="flip-card-front">
                        <img class="profile-picture" src="imgs/circle.png" alt="">
                    </div>
                    <div class="flip-card-back">
                        <h1 id="full-name">Raz Nehoray Oren</h1>
                        <p class="flip-card-paragraph" >Surfer & Student.</p>
                        <p class="flip-card-paragraph">Tel-Aviv, Israel.</p>
                        <p class="flip-card-paragraph">Age 28.</p>
                        <a href=" https://instagram.com/razoren?utm_medium=copy_link"> <img id="instagram-logo" src="imgs/instagram.png">
                        </a>
                        <br>
                        <a href="https://www.facebook.com/raz.oren.3/"> <img id="facebook-logo" src="imgs/facebook.png">
    
                        </a>
    
                    </div>
                </div>
                </div>
                </div>

                <br><br>

                <div class="detailedAbout">
                My Name is Raz Nehoray Oren. I'm 28 years old, born and raised in Tel-Aviv. 
                I went to school in Tel-Aviv and after I graduated high school, I drafted into the army and served for 3 years. 
                When I completed my service, I left Israel and worked as a surf instructor in several countries around the world. 
                Due to the Corona Virus, I unfortunately had to stop working as a surfing instructor, So I decided to start learning 
                something new that would be interesting to me, and here I'm today studying Full-Stack. 
                My website provides the constant change in price of each coin and gets updated every 2 minutes. 
                </div>`;

            $('.about-container').show();
            $('.about-container').append(about);
        };

        function onAddHomePageContainerToUiCliked() {
            clearHtml();
            $('.parallax').show();
            $('.coins-container').show();
            $("#back-to-top-div").show();
            addCoinsToUI(cachedCoinsArray);
        }

        function clearHtml() {
            clearInterval(chartIntervalId);
            $('.parallax').hide();
            $("#back-to-top-div").hide();
            $('.coins-container').empty().hide();
            $("#charts-div-container").empty().hide();
            $('.about-container').empty().hide();
        }

        function showLiveReports() {
            let coinsChosenArray = new Array();
            for (let coinId of toggledCoins) {
                let [currentCoin] = cachedCoinsArray.filter(coin => coinId == coin);
                coinsChosenArray.push(currentCoin);
            }
            console.log(coinsChosenArray);
            let incompleteCoinsPricesUrl = "https://min-api.cryptocompare.com/data/pricemulti?fsyms="
            for (let coin of coinsChosenArray) {
                incompleteCoinsPricesUrl = incompleteCoinsPricesUrl + coin.symbol.toUpperCase() + ",";
            }
            //removing the spare ','
            incompleteCoinsPricesUrl = incompleteCoinsPricesUrl.substring(0, incompleteCoinsPricesUrl.length - 1);
            let coinPricesUrl = incompleteCoinsPricesUrl + "&tsyms=USD";

            var dataPoints = [];
            for (let i = 0; i < 5; i++) {
                dataPoints[i] = [];
            }
            var options = {
                title: {
                    text: "Crypto Coin Price Value"
                },
                axisX: {
                    title: "Time"
                },
                axisY: {
                    title: "USD",
                    suffix: "$"
                },
                toolTip: {
                    shared: true
                },
                legend: {
                    cursor: "pointer",
                    verticalAlign: "top",
                    fontSize: 22,
                    fontColor: "dimGrey",
                    itemclick: toggleDataSeries
                },
                data: []
            };

            for (let i = 0; i < coinsChosenArray.length; i++) {
                options.data.push({
                    type: "line",
                    xValueType: "dateTime",
                    yValueFormatString: "###.00$",
                    showInLegend: true,
                    name: coinsChosenArray[i].name,
                    dataPoints: dataPoints[i]
                });
            }

            var chart = $("#chartContainer").CanvasJSChart(options);

            function toggleDataSeries(e) {
                if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
                    e.dataSeries.visible = false;
                }

                else {
                    e.dataSeries.visible = true;
                }
                e.chart.render();
            }

            var updateInterval = 2000;
            // initial value
            let yValue = [5];
            var time = new Date;

            function setChartValues(coinsObject) {
                for (let i = 0; i < coinsChosenArray.length; i++) {
                    let currentSymbol = coinsChosenArray[i].symbol.toUpperCase();
                    yValue[i] = coinsObject[currentSymbol].USD;
                    console.log(yValue[i]);
                }
            }

            $.get(coinPricesUrl).then(function (coinsObject) {
                setChartValues(coinsObject);
                chartIntervalId = setInterval(function () {
                    updateChart()
                }, updateInterval);
            })
                .catch(function (error) {
                    console.log(error);
                    alert("Failed to get coins data - charts");
                });

            function updateChart() {

                $.get(coinPricesUrl).then(function (coinsObject) {
                    setChartValues(coinsObject);
                })
                    .catch(function (error) {
                        console.log(error);
                        alert("Failed to get coins data - charts");
                    });
                time.setTime(time.getTime() + updateInterval);
                // pushing the new values
                dataPoints[0].push({
                    x: time.getTime(),
                    y: yValue[0]
                });
                dataPoints[1].push({
                    x: time.getTime(),
                    y: yValue[1]
                });
                dataPoints[2].push({
                    x: time.getTime(),
                    y: yValue[2]
                });
                dataPoints[3].push({
                    x: time.getTime(),
                    y: yValue[3]
                });
                dataPoints[4].push({
                    x: time.getTime(),
                    y: yValue[4]
                });
                // updating legend text with  updated with y Value 
                for (let i = 0; i < coinsChosenArray; i++) {
                    options.data[i].legendText = coin.name + " : " + yValue1 + "$";
                }
                $("#chartContainer").CanvasJSChart().render();
            }
        }

    });

})();