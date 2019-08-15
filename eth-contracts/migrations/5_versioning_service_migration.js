const contractConfig = require('../contract-config.js')

const Registry = artifacts.require('Registry')
const VersioningStorage = artifacts.require('VersioningStorage')
const VersioningFactory = artifacts.require('VersioningFactory')
const ServiceProviderStorage = artifacts.require('ServiceProviderStorage')
const ServiceProviderFactory = artifacts.require('ServiceProviderFactory')
const Staking = artifacts.require('Staking')
const OwnedUpgradeabilityProxy = artifacts.require('OwnedUpgradeabilityProxy')

const versioningStorageKey = web3.utils.utf8ToHex('VersioningStorage')
const versioningFactoryKey = web3.utils.utf8ToHex('VersioningFactory')
const serviceProviderFactoryKey = web3.utils.utf8ToHex('ServiceProviderFactory')
const serviceProviderStorageKey = web3.utils.utf8ToHex('ServiceProviderStorage')
const ownedUpgradeabilityProxyKey = web3.utils.utf8ToHex('OwnedUpgradeabilityProxy')

module.exports = (deployer, network, accounts) => {
  deployer.then(async () => {
    const config = contractConfig[network]
    const versionerAddress = config.versionerAddress || accounts[0]
    let registry = await Registry.at('0x53CFeD846d43BbF4C092f5a5c6F618515Ae137C1')// Registry.deployed()
    console.log(Registry.address)
    let vstgaddr = (await VersioningStorage.at('0xE8903cdeD066D86e9fEB07E24D28337CDFcEbd11')).address
    console.log(vstgaddr)
    // await registry.addContract(versioningStorageKey, vstgaddr)
    let proxy = await OwnedUpgradeabilityProxy.at('0xB20be11a83E4afAD2533147b0a1e79cBCca5cc80')// deployed()
    console.log(proxy.address)
    let staking = await Staking.at(proxy.address)
    await staking.setStakingOwnerAddress('0x99e3c11c3106EC436959641F3bee9Ebea8B38822')
    return

    /*
    console.log('2')
    let registry = await Registry.at('0x83b4dE4648bF98D06a0c2684542290331B6316B6')// deployed()
    console.log('3')
    const networkId = Registry.network_id
    const config = contractConfig[network]

    let proxy = await OwnedUpgradeabilityProxy.at('0x4847678B82C5EF48811c5a6afA223a147c98E41a')// deployed()
    console.log(proxy.address)
    console.log(await proxy.proxyOwner())

    let deployedVersioningStg = await VersioningStorage.at('0x2456a27BaE45EC1178B2a5dAcFd58ffE27423ca8') //deployed()
    console.log(deployedVersioningStg.address)
    console.log(await registry.getContract(serviceProviderFactoryKey))

    let staking = await Staking.at(proxy.address)
    console.log(await staking.supportsHistory())
    console.log(accounts[0])
    return
    try {
      let tx = await staking.setStakingOwnerAddress('0x2292F4a63796A7811EE0CEf0186fcE0320F4399D')
    } catch(e) {
      console.log(e)
    }
    return
    */

    /*
    // await deployer.deploy(VersioningStorage, Registry.address)
    // await registry.addContract(versioningStorageKey, VersioningStorage.addres)
    await deployer.deploy(VersioningFactory, Registry.address, versioningStorageKey, versionerAddress)
    await registry.addContract(versioningFactoryKey, VersioningFactory.address)

    await deployer.deploy(ServiceProviderStorage, Registry.address)
    await registry.addContract(serviceProviderStorageKey, ServiceProviderStorage.address)

    let serviceProviderFactory = await deployer.deploy(
      ServiceProviderFactory,
      Registry.address,
      ownedUpgradeabilityProxyKey,
      serviceProviderStorageKey)

    await registry.addContract(serviceProviderFactoryKey, ServiceProviderFactory.address)

    // Configure owner of staking contract to be service provider factory
    let proxy = await OwnedUpgradeabilityProxy.deployed()
    let staking = await Staking.at(proxy.address)
    await staking.setStakingOwnerAddress(serviceProviderFactory.address, { from: config.treasuryAddress })
    */
  })
}
