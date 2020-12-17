let state = {
    units: [],
    wholeBuildings: []
}

const getBuildings = async () => {
    const collection = await db.collection("buildings");
    const snapshot = await collection.get();
    return snapshot.docs
        .map((building) => ({
            id: building.id,
            data: building.data(),
        }))
};

const getUnits = async () => {
    const collection = await db.collection("Units");
    const snapshot = await collection.get();
    return snapshot.docs.map((unit) => ({
        id: unit.id,
        data: unit.data(),
    }));
};

async function init() {
    try {
        const buildings = await getBuildings();
        const units = await getUnits();

        // the rest of your code here

        // console.log(units, "units")
        let buildingsSearchInput = document.getElementById("search-input-buildings")
        buildingsSearchInput.addEventListener('keyup', function () {
            let value = this.value
            let newData = searchBuildingVals(value, buildings)
            filterBuildings(newData)
        })

        let wholeBuildings = units.filter(unit => unit.data.isWholeBuilding)

        state.wholeBuildings = wholeBuildings
        buildBuildingsTable(buildings);

        let allUnits = units.filter(unit => !unit.data.isWholeBuilding)

        buildTable(allUnits)

        let unitsSearchInput = document.getElementById("search-input-units")
        state.units = allUnits
        unitsSearchInput.addEventListener('keyup', function () {
            let value = this.value
            let newData = searchUnitVals(value, state.units)
            buildTable(newData)
        })
        console.log(buildings, "buildings")
        console.log(units, "units")
        return { buildings, units }
    } catch (error) {
        console.error(error);
    }
}

init().then((res) => console.log(res));




function buildBuildingsTable(data) {
    // console.log(data, 'data Building buildings...')
    // console.log(state.wholeBuildings, "state wholebuild")
    console.log(state, "state")
    document.getElementById("hideLoad").style.display = "none";

    var table = document.getElementById('buildingsTable')
    table.innerHTML = ""
    for (var i = 0; i < data.length; i++) {
        let theStateUnit = state.wholeBuildings.find(building => building.data.building_id === data[i].id)
        var row = `
                    <table id=${data[i].id}
                    class="table table-striped building-tables">
                    <caption class="caption">${data[i].data.seo}</caption>
                        <tr>
                        <th id="building-name"><a href="${theStateUnit.data.fileUrl}" target="_blank">${data[i].data.name}</a></th>
                        <th><a href="https://www.google.com/maps/dir/Current+Location/${data[i].data.location.latitude},${data[i].data.location.longitude}" target="_blank">Directions</a></th>
                        <th><button id="calc-rent-${data[i].id}" data-rent-calculation="monthly" class="btn-sm" onClick="calcRent(event)">Monthly</button></th>
                        </tr>
                        <tr class="bg-info">
                        <th>Name <span id="name-order-${data[i].id}" class="name-order" data-order="desc" onclick="orderData(event)">&#9650</span></th>
                        <th>Size <span class="tool" data-tip="the leaseable square feet plus a portion of the building's common space.">RSF</span><span id="size-order-${data[i].id}" class="size-order" data-order="desc" onclick="orderData(event)">&#9650</span></th>
                        <th>Price <span id="price-order-${data[i].id}" class="price-order" data-order="desc" onclick="orderData(event)">&#9650</span></th>
                        </tr>               
                    </table >
                    <br>`
        table.innerHTML += row
    }
}

const calcRent = (e) => {
    // console.log("calcrent called")
    // console.log(e.target, "target")
    let rentRate = e.target.getAttribute('data-rent-calculation');
    let targetArr = e.target.id.split('-')
    let currRentCalcId = targetArr[targetArr.length - 1]
    // console.log(currRentCalcId, "calcId")
    let currentTableRows = document.getElementById(currRentCalcId).querySelectorAll(".addedRow");
    // console.log(currentTableRows, "currentTableRows")
    if (rentRate === "monthly") {
        e.target.setAttribute("data-rent-calculation", "rsqft/yr");
        e.target.innerHTML = 'rsqft/yr'
        currentTableRows.forEach(row => {
            let rsqftyr = ((row.children[2].innerText / row.children[1].innerText) * 12).toFixed(2)
            row.children[2].innerText = rsqftyr
            let id = row.getAttribute('id')
            let adjustedUnit = state.units.find(unit => unit.id === id)
            adjustedUnit.data.price = rsqftyr
        })
    } else if (rentRate === 'rsqft/yr') {
        e.target.setAttribute("data-rent-calculation", "monthly");
        e.target.innerHTML = 'Monthly'
        currentTableRows.forEach(row => {
            let monthly = ((row.children[2].innerText * row.children[1].innerText) / 12).toFixed()
            row.children[2].innerText = monthly
            let id = row.getAttribute('id')
            let adjustedUnit = state.units.find(unit => unit.id === id)
            adjustedUnit.data.price = monthly
        })
    }

    // console.log(state, "state")

}

const orderData = (e) => {
    let dataHolder = []
    let targetArr = e.target.id.split('-')
    let currTableId = targetArr[targetArr.length - 1]
    let currentTable = document.getElementById(currTableId).querySelectorAll(".addedRow");
    let containerArr = []
    currentTable.forEach(row => {
        // console.log(row, "=in the order Data the row is")
        let id = row.getAttribute('id')
        let fileUrl = row.getAttribute('link')
        console.log(fileUrl, "the file Url 169")
        // console.log(id, "the id in order data")
        let myArr = [row.children[0].innerText, row.children[1].innerText, row.children[2].innerText, id, fileUrl]
        containerArr.push(myArr)
    })

    const customSort = (arr, idx, order) => {
        let temp;
        if (order === "ascen") {
            for (let i = 0; i < arr.length - 1; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                    if (arr[i][idx] < arr[j][idx]) {
                        temp = arr[i][idx]
                        arr[i][idx] = arr[j][idx]
                        arr[j][idx] = temp
                    }
                }
            }
        } else {
            for (let i = 0; i < arr.length - 1; i++) {
                for (let j = i + 1; j < arr.length; j++) {
                    if (arr[i][idx] > arr[j][idx]) {
                        temp = arr[i][idx]
                        arr[i][idx] = arr[j][idx]
                        arr[j][idx] = temp
                    }
                }
            }
        }
        return arr
    }

    let currentOrder = e.target.getAttribute('data-order');
    // console.log(currentOrder, "order is currentl")
    if (currentOrder === "desc") {
        e.target.setAttribute("data-order", "ascen");
        // console.log(e.target.innerHtml, "inner htmo")
        e.target.innerHTML = '&#9660'
        if (e.target.className === "name-order") {
            containerArr.sort((a, b) => a[0] > b[0] ? 1 : -1)
            // containerArr.sort(function (a, b) { return a[0] - b[0]; });
        } else if (e.target.className === "price-order") {
            // containerArr.sort((a, b) => a[1] > b[1] ? 1 : -1)
            containerArr.sort(function (a, b) { return Number(a[2]) - Number(b[2]); });
            // customSort(containerArr, 2, currentOrder)
            // console.log(containerArr, "containerArr")

        } else if (e.target.className === "size-order") {
            // containerArr.sort((a, b) => a[2] > b[2] ? 1 : -1)
            containerArr.sort(function (a, b) { return Number(a[1]) - Number(b[1]); });
            // customSort(containerArr, 1, currentOrder)
            // console.log(containerArr, "containerArr")
        }
    } else if (currentOrder === "ascen") {
        e.target.innerHTML = '&#9650'
        e.target.setAttribute("data-order", "desc");
        if (e.target.className === "name-order") {
            containerArr.sort((a, b) => a[0] < b[0] ? 1 : -1)
            // containerArr.sort(function (a, b) { return b[0] - a[0];);

        } else if (e.target.className === "price-order") {
            // containerArr.sort((a, b) => a[1] < b[1] ? 1 : -1)
            containerArr.sort(function (a, b) { return Number(b[2]) - Number(a[2]); });
            // customSort(containerArr, 2, currentOrder)
            // console.log(containerArr, "containerArr")

        } else if (e.target.className === "size-order") {
            // containerArr.sort((a, b) => a[2] < b[2] ? 1 : -1)
            containerArr.sort(function (a, b) { return Number(b[1]) - Number(a[1]); });
            // customSort(containerArr, 1, currentOrder)
            // console.log(containerArr, "containerArr")
        }
    }

    containerArr.forEach(container => {
        let objwData = { data: {} }
        objwData.data['name'] = container[0]
        objwData.data['size'] = container[1]
        objwData.data['price'] = container[2]
        objwData.data['building_id'] = currTableId
        objwData.data['leave'] = true
        objwData.id = container[3]
        objwData.data['fileUrl'] = container[4]
        dataHolder.push(objwData)
    })
    buildTable(dataHolder)
}

function filterBuildings(data) {
    // console.log(data, "data in filter buildings")
    let ids = []
    data.forEach(building => ids.push(building.id))
    // console.log(ids, "ids")
    let tables = document.getElementsByClassName('building-tables')
    Array.from(tables).forEach((table) => {
        if (ids.indexOf(table.id) === -1) {
            table.style.display = "none"
        } else {
            table.style.display = "table"
        }
    })
}

function buildTable(data) {
    console.log(data, "=buildTable run with data")
    var tables = document.getElementsByClassName('building-tables')
    if (data.length > 0) {
        if (!data[0].data.leave) {
            let addedRows = document.getElementsByClassName('addedRow')
            Array.from(addedRows).forEach((row) => {
                row.remove()
            })
        }


        Array.from(tables).forEach((table) => {
            if (table.id === data[0].data.building_id) {
                let clearRows = table.querySelectorAll(".addedRow")
                for (var i = 0; i < clearRows.length; ++i) {
                    clearRows[i].remove();
                }
            }
            let rowLength = 0;
            for (var i = 0; i < data.length; i++) {
                if (table.id === data[i].data.building_id) {
                    var row = table.insertRow(-1);
                    row.className = "addedRow"
                    row.setAttribute('id', data[i].id);
                    row.setAttribute('link', data[i].data.fileUrl)
                    var cell1 = row.insertCell(0);
                    var cell2 = row.insertCell(1);
                    var cell3 = row.insertCell(2)
                    cell1.innerHTML = `<a href=${data[i].data.fileUrl} target="_blank">${data[i].data.name}</a>`
                    cell2.innerHTML = data[i].data.size;
                    cell3.innerHTML = data[i].data.price;
                    rowLength++
                }
            }
            // if (!data[0].data.leave) {
            //     if (rowLength === 0) {
            //         var row = table.insertRow(-1);
            //         row.className = "emptyRow"
            //         var cell1 = row.insertCell(0);
            //         cell1.innerHTML = "No Data to display";
            //         cell1.colSpan = 3
            //     }
            // }
        })
    } else {
        let addedRows = document.getElementsByClassName('addedRow')
        Array.from(addedRows).forEach((row) => {
            row.remove()
        })
        // let tables = document.getElementsByClassName('table')
        // Array.from(tables).forEach((table) => {
        //     var row = table.insertRow(-1);
        //     row.className = "emptyRow"
        //     var cell1 = row.insertCell(0);
        //     cell1.innerHTML = "No Data to display";
        //     cell1.colSpan = 3
        // })

    }
}
function searchBuildingVals(value, data) {
    let filtered = []
    for (let i = 0; i < data.length; i++) {
        value = value.toLowerCase()
        let name = data[i].data.name.toLowerCase()
        let seo = data[i].data.seo.toLowerCase()
        if (name.includes(value) || seo.includes(value)) {
            filtered.push(data[i])
        }
    }
    return filtered
}

function searchUnitVals(value, data) {
    console.log('searchUnitVals called 272')
    let filtered = []
    for (let i = 0; i < data.length; i++) {
        value = value.toLowerCase()
        let name = data[i].data.name.toLowerCase()
        let price = data[i].data.price
        let size = data[i].data.size
        if (name.includes(value) || price.startsWith(value) || size.startsWith(value)) {
            filtered.push(data[i])
        }
    }
    return filtered
}