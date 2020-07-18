/* 
 * branch.js - Splits messages, enables branching the flow
 * 
 * (C) 2018 TekMonks. All rights reserved.
 */

exports.start = (routeName, branch, messageContainer, message) => {
    const clones = [];
    for (const output of branch.outputs) {
        try {
            const clone = message.clone();
            clone.addRouteDone(output);
            clones.push(clone);
        } catch (err) {
            LOG.error(`[BRANCH] Clone error, ${err}`);
            LOG.error("[BRANCH] Message creation error, throttling."); 
            return;
        }
    };

    for (const clone of clones) messageContainer.add(clone);
    message.addRouteDone(routeName);
    LOG.info(`[BRANCH] Created outputs ${branch.outputs}`);
}