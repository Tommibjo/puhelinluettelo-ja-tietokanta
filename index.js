const express = require("express")
const app = express()
const bodyParser = require("body-parser")
const morgan = require('morgan')
const cors = require('cors')
const Person = require('./models/person')
app.use(cors())
app.use(express.static('build'))
app.use(bodyParser.json())
morgan.token('body', function (req, res) {
    return JSON.stringify(req.body)
})
app.use(morgan(':method :url :status :res[content-length] :response-time ms - :body'))


// Toimivat mongoosen kanssa
app.get("/api/persons", (request, response, next) => {
    Person.find({}).then(result => {
        response.json(result.map(person => person.toJSON()))
    }).catch(error => next(error))
})

app.delete("/api/persons/:id", (request, response, next) => {
    Person.findByIdAndDelete(request.params.id).then(result => {
        if (result) {
            response.status(204).end()
        } else {
            response.status(404).end()
        }
    }).catch(error => next(error))
})

app.post("/api/persons/", (request, response, next) => {
    const personObject = request.body
    if (personObject.name === undefined || personObject.number === undefined) {
        response.status(400).json({ error: "name or number is missing" })
    }

    const person = new Person({
        name: personObject.name,
        number: personObject.number
    })
    person.save().then(savedPerson => {
        response.json(savedPerson.toJSON())
    }).catch(error => next(error))
})

app.put('/api/persons/:id', (request, response) => {
    const person = request.body
    console.log(person)

    const modifiedPerson = {
        name: person.name,
        number: person.number
    }

    Person.findByIdAndUpdate(request.params.id, modifiedPerson, { new: true }).then(updatedPerson => {
        response.json(updatedPerson.toJSON())
    }).catch(error => next(error))



})

app.get("/info", (request, response) => {
    Person.countDocuments({}).then(result => {
        console.log(result)
        response.send("Phonebook has info for " + result + " people <br/>" + new Date())
    })
})

app.get("/api/persons/:id", (request, response, next) => {
    Person.findById(request.params.id).then(result => {
        if (result) {
            response.json(result.toJSON())
        } else {
            response.status(404).end()
        }
    }).catch(error => next(error))
})

// ===========================

// Middleware
const errorHandler = (error, req, res, next) => {
    if (error.kind === "ObjectId" && error.name === "CastError") {
        return res.status(400).send({ Error: "Malformed ID" })
    }

    if (error.kind === "unique" && error.name === "ValidatorError") {
        console.log(error)
        return res.status(409).send({ error: "Diudau" + error.message })
    }
    console.log(error)
    return res.status(409).send({ error: error.message })

    next(error)
}

app.use(errorHandler)

const port = process.env.PORT || 3001
app.listen(port, () => {
    console.log("Server is running on port " + port)
})