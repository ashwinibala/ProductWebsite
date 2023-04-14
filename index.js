const express = require('express')
const { check, validationResult } = require('express-validator');
let myApp = express()
const path = require('path')
const mongoose = require('mongoose')

myApp.set('views', path.join(__dirname, 'views'))
// myApp.use(express.static(__dirname + '/public'))
// myApp.use('/css', express.static(path.join(__dirname, 'public/stylesheets')));

myApp.use('*/css', express.static('public/css'));
myApp.use('*/images', express.static('public/images'));
myApp.set('view engine', 'ejs')

myApp.use(express.urlencoded({ extended: false }))

// mongo DB connection and model
mongoose.connect('mongodb://0.0.0.0:27017/thecandyshop', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const Orders = mongoose.model('orders', {
    name: String,
    address: String,
    province: String,
    city: String,
    email: String,
    phone: String,
    darkRoastedCoffeeToffee: Number,
    darkRoastedCoffeeToffeeTotal: Number,
    coffeeCaramelBars: Number,
    coffeeCaramelBarsTotal: Number,
    coffeeChocolateMousse: Number,
    coffeeChocolateMousseTotal: Number,
    coffeeChocolateDonuts: Number,
    coffeeChocolateDonutsTotal: Number,
    coffeeChocolateChipCookie: Number,
    coffeeChocolateChipCookieTotal: Number,
    assortedPacks: Number,
    assortedPacksTotal: Number,
    total: Number,
    tax: Number,
    overallTotal: Number
})

// variable definitions
const phoneRegex = /^[0-9]{3}\-[0-9]{3}\-[0-9]{4}$/
const positiveNumberRegex = /^[0-9]*$/

const taxRates = new Object()

taxRates.Alberta = 5
taxRates.BritishColumbia = 12
taxRates.Manitoba = 12
taxRates.NewBrunswick = 15
taxRates.NewFoundLand = 15
taxRates.NorthWestTerritories = 5
taxRates.NovaScotia = 15
taxRates.Nunavut = 5
taxRates.Ontario = 13
taxRates.PrinceEdwardIsland = 15
taxRates.Quebec = 14.975
taxRates.Saskatchewan = 11
taxRates.Yukon = 5

// Validations
const checkRegex = (value, regex) => {
    return regex.test(value) ? true : false
}
const checkPhone = (value) => {
    if (!checkRegex(value, phoneRegex)) {
        throw new Error("Phone number should be in format: xxx-xxx-xxxx")
    }
    return true
}

const checkPositiveNumber = (value) => {
    if (!checkRegex(value, positiveNumberRegex)) {
        throw new Error("Enter a positive number in product quantity")
    }
    return true
}

// Request methods
myApp.get('/', (req, res) => {
    res.render('home')
})

myApp.get('/products', (req, res) => {
    res.render('candies')
})

myApp.get('/orders', async (req, res) => {
    const data = await Orders.find()
    res.render('orders', { data })
})

myApp.get('/orders/:name', async (req, res) => {
    const singleOrder = await Orders.findOne({ name: { $regex: req.params.name, $options: 'i' } }).exec()
    res.render('singleOrder', { order: singleOrder })
})

myApp.post('/product', [
    check('name', 'Must have a name').not().isEmpty(),
    check('address', 'Must have a address').not().isEmpty(),
    check('city', 'Must have a city').not().isEmpty(),
    check('province', 'Must have a province').not().isEmpty(),
    check('email', 'Enter a valid email address').isEmail(),
    check('phone').custom(checkPhone),
    check('darkRoastedCoffeeToffee').custom(checkPositiveNumber),
    check('coffeeCaramelBars').custom(checkPositiveNumber),
    check('coffeeChocolateMousse').custom(checkPositiveNumber),
    check('coffeeChocolateDonuts').custom(checkPositiveNumber),
    check('coffeeChocolateChipCookie').custom(checkPositiveNumber),
    check('assortedPacks').custom(checkPositiveNumber)
], (req, res) => {
    const errors = validationResult(req)
    let productValues = false
    if (req.body.darkRoastedCoffeeToffee != 0 || req.body.coffeeCaramelBars != 0 || req.body.coffeeChocolateMousse != 0 || req.body.coffeeChocolateDonuts != 0 || req.body.coffeeChocolateChipCookie != 0 || req.body.assortedPacks != 0) {
        productValues = true  // this is the verify that at least one product is selected to proceed to the receipt page.
    }
    if (!errors.isEmpty()) {
        res.render('candies', {
            errors: errors.array()
        })
    } else if (productValues == true) {
        const formElements = new Object()
        formElements.name = req.body.name
        formElements.address = req.body.address
        formElements.province = req.body.province
        formElements.city = req.body.city
        formElements.email = req.body.email
        formElements.phone = req.body.phone
        formElements.darkRoastedCoffeeToffee = req.body.darkRoastedCoffeeToffee | 0
        formElements.darkRoastedCoffeeToffeeTotal = formElements.darkRoastedCoffeeToffee * 15
        formElements.coffeeCaramelBars = req.body.coffeeCaramelBars | 0
        formElements.coffeeCaramelBarsTotal = formElements.coffeeCaramelBars * 12
        formElements.coffeeChocolateMousse = req.body.coffeeChocolateMousse | 0
        formElements.coffeeChocolateMousseTotal = formElements.coffeeChocolateMousse * 17
        formElements.coffeeChocolateDonuts = req.body.coffeeChocolateDonuts | 0
        formElements.coffeeChocolateDonutsTotal = formElements.coffeeChocolateDonuts * 12
        formElements.coffeeChocolateChipCookie = req.body.coffeeChocolateChipCookie | 0
        formElements.coffeeChocolateChipCookieTotal = formElements.coffeeChocolateChipCookie * 10
        formElements.assortedPacks = req.body.assortedPacks | 0
        formElements.assortedPacksTotal = formElements.assortedPacks * 15

        formElements.total = formElements.darkRoastedCoffeeToffeeTotal + formElements.coffeeCaramelBarsTotal + formElements.coffeeChocolateMousseTotal + formElements.coffeeChocolateDonutsTotal + formElements.coffeeChocolateChipCookieTotal + formElements.assortedPacksTotal
        formElements.tax = taxRates[formElements.province] / 100 * formElements.total
        formElements.overallTotal = formElements.total + formElements.tax

        // Saving the order into mongo DB
        let myOrders = new Orders(formElements);
        myOrders.save()

        res.render('receiptPage', {
            formElements
        })
    } else {
        res.render('candies')
    }
})

// NodeJS Server status check print logs and listening port number
myApp.listen(8080)
console.log('Starting 8080 server')
