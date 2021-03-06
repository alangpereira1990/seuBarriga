const express = require('express')

module.exports = (app) => {

    const router = express.Router()    

    router.get('/', (req,resp,next) => {
        app.services.balance.getSaldo(req.user.id).then(result => {
            resp.status(200).json(result)
        }).catch(err => next(err))
    })

    return router
}