const AudiusToken = artifacts.require('AudiusToken')

module.exports = (deployer, network, accounts) => {
    return
    deployer.deploy(AudiusToken)
}
