const _ = require('lodash')

const Utils = require('../utils')
const CreatorNode = require('../services/creatorNode')

const THREE_SECONDS = 3000
const MAX_TRIES = 3

const nodeIsHealthy = async (endpoint, tries) => {
  const healthy = await Utils.isHealthy(endpoint)
  if (healthy) return healthy
  else {
    if (tries === 0) return false
    await Utils.wait(THREE_SECONDS)
    return nodeIsHealthy(endpoint, tries - 1)
  }
}

const getUpToDateSecondary = async (libs, secondaries) => {
  for (const secondary of secondaries) {
    const { isBehind } = await libs.creatorNode.getSyncStatus(secondary)
    if (!isBehind) {
      return secondary
    }
  }
  return null
}

/** If selected primary or secondaries unhealthy, select new one and update user state. */
const rolloverNodes = async (libs, creatorNodeWhitelist) => {
  console.error('ROLLOVER NODES')
  const user = libs.userStateManager.getCurrentUser()

  if (!user || !user.is_creator) return

  const primary = CreatorNode.getPrimary(user.creator_node_endpoint)
  const secondaries = CreatorNode.getSecondaries(user.creator_node_endpoint)

  console.error(`PRIMARY: ${primary} || SECONDARY: ${secondaries.join(',')}`)

  try {
    let newPrimary = primary
    let newSecondaries = [...secondaries]

    // Select new primary from secondaries if necessary, and remove that node from secondaries list.
    if (!await nodeIsHealthy(primary, MAX_TRIES)) {
      const upToDateSecondary = await getUpToDateSecondary(libs, secondaries)
      if (!upToDateSecondary) {
        throw new Error('Cannot select new primary - no valid secondaries found for user.')
      }
      newPrimary = upToDateSecondary
      newSecondaries.splice(secondaries.indexOf(upToDateSecondary), 1)
      console.error(`UPDATED PRIMARY TO ${newPrimary} from ${primary}`)
    }

    // Filter out unhealthy secondaries.
    // TODO - see if possible to replace with filter with await isHealthy check
    const unhealthySecondaries = []
    for (const secondary of newSecondaries) {
      if (!await nodeIsHealthy(secondary, MAX_TRIES)) {
        unhealthySecondaries.push(secondary)
      }
    }
    newSecondaries = newSecondaries.filter(s => !unhealthySecondaries.includes(s))
    console.error(`NEW SECONDARIES after filtering out unhealthy ${newSecondaries.join(',')}`)

    if (newSecondaries.length >= 2 && _.isEqual(primary, newPrimary) && _.isEqual(secondaries, newSecondaries)) {
      console.error(`EXITING WITH NO CHANGES`)
      return
    }

    // Backfill secondaries as needed.
    const { primary: autoPrimary, secondaries: autoSecondaries } = await libs.ServiceProvider.autoSelectCreatorNodes(
      2 - newSecondaries.length,
      creatorNodeWhitelist,
      // Exclude ones we currently have.
      new Set([newPrimary, ...newSecondaries])
    )
    console.error(`AUTOSELECT RETURNS PRIMARY ${autoPrimary} and SECONDARIES ${autoSecondaries.join(',')}`)
    newSecondaries = newSecondaries.concat([autoPrimary, ...autoSecondaries])
    const newEndpoints = [newPrimary, ...newSecondaries]

    console.error(`NEWPRIMARY: ${newPrimary} || NEWSECONDARY: ${newSecondaries.join(',')}`)

    // Set and connect to new primary endpoint.
    await libs.creatorNode.setEndpoint(newPrimary)

    // Update user's state with new nodes.
    const newMetadata = { ...user }
    newMetadata.creator_node_endpoint = newEndpoints.join(',')
    await libs.User.updateCreator(user.user_id, newMetadata)
  } catch (e) {
    console.error(e)
  }
}

module.exports = rolloverNodes
