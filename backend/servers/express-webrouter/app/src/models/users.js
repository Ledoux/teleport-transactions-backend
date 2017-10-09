const model = { createIndex: 1,
  items: [
    { key: 'email', type: 'String', isRequired: true },
    { key: 'firstName', type: 'String', isRequired: true },
    { key: 'id', type: 'String', isAutomatic: true },
    { key: 'lastName', type: 'String', isRequired: true },
    { key: 'password', type: 'String', isRequired: true }
  ]
}

export default model
