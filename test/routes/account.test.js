const request = require('supertest')
const { db } = require('../../src/app')
const app = require('../../src/app')

const MAIN_ROUTE = '/v1/accounts'
let user
let user2
let token

let name = 'acc1'

beforeAll(async() => {
    let name = 'User Test Account'
    let mail = `${Date.now()}@mail.com`
    let password = '1234'
    const result = await app.services.user.save({name, mail, password})
    user = {...result[0]}

    const usrl = await app.services.authService.signin({mail,password})
    token = usrl.token

    name = 'User Test Account 2'
    mail = `${Date.now()}@mail.com`
    password = '1234'
    const result2 = await app.services.user.save({name, mail, password})
    user2 = {...result2[0]}
})

test('Deve inserir uma conta com sucesso', async() => {
    const result = await request(app)
        .post(MAIN_ROUTE)
        .send({name})
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(201)
    expect(result.body.name).toBe(name)
})

test('Deve listar apenas as contas do usuário', async() => {
    await app.db('accounts').where({user_id: user.id}).del()
    await app.db('accounts').insert({name: 'acc-1', user_id: user.id})
    await app.db('accounts').insert({name: 'acc-2', user_id: user2.id})
    const result = await request(app)
        .get(MAIN_ROUTE)
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(200)
    expect(result.body[0].name).toBe('acc-1')
    expect(result.body.length).toBe(1)
})

test('Deve retornar uma conta por ID', async() => {
    const account = await app.db('accounts').insert({name, user_id: user.id}, ['id'])
    const result = await request(app)
        .get(`${MAIN_ROUTE}/${account[0].id}`)
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(200)
    expect(result.body.user_id).toBe(user.id)
    expect(result.body.name).toBe(name)
})

test('Deve alterar uma conta', async() => {
    let newName = `${name} updated`
    const account = await app.db('accounts').insert({name, user_id: user.id}, ['id'])
    const result = await request(app)
        .put(`${MAIN_ROUTE}/${account[0].id}`)
        .send({name: newName})
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(201)
    expect(result.body.name).toBe(newName)
})

test('Deve remover uma conta', async() => {
    const account = await app.db('accounts').insert({name, user_id: user.id}, ['id'])
    const result = await request(app)
        .delete(`${MAIN_ROUTE}/${account[0].id}`)
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(204)
})

test('Não deve inserir uma conta sem nome', async() => {
    const result = await request(app)
        .post(MAIN_ROUTE)
        .send({name: ''})
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Nome é um atributo obrigatório')
})

test('Não deve inserir uma conta de nome duplicado, para o mesmo usuário', async() => {
    await app.db('accounts').insert({name, user_id: user.id})
    const result = await request(app)
        .post(MAIN_ROUTE)
        .send({name})
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(400)
    expect(result.body.error).toBe('Já existe uma conta com este nome')
})

test('Não deve retornar uma conta de outro usuário', async() => {
    const account = await app.db('accounts').insert({name, user_id: user2.id}, ['id'])
    const result = await request(app)
        .get(`${MAIN_ROUTE}/${account[0].id}`)
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(403)
    expect(result.body.error).toBe('Recurso não pertence ao usuário')
})

test('Não deve alterar a conta de outro usuário', async() => {
    const account = await app.db('accounts').insert({name, user_id: user2.id}, ['id'])
    const result = await request(app)
        .put(`${MAIN_ROUTE}/${account[0].id}`)
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(403)
    expect(result.body.error).toBe('Recurso não pertence ao usuário')   
})

test('Não deve remover a conta de outro usuário', async() => {
    const account = await app.db('accounts').insert({name, user_id: user2.id}, ['id'])
    const result = await request(app)
        .delete(`${MAIN_ROUTE}/${account[0].id}`)
        .set('authorization',`bearer ${token}`)
    expect(result.status).toBe(403)
    expect(result.body.error).toBe('Recurso não pertence ao usuário')   
})