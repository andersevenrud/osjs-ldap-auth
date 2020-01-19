/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
const merge = require('lodash.merge');
const {Client} =  require('ldapts');

/*
 * Removes invalid characters from a string
 */
const cleanUsername =  str => str.trim()
  .replace(/(,|\+|"|\\|<|>|;|=|\r|\n)/g, '');

/*
 * Creates a DC from domain
 */
const createDcs = str => str.split('.')
  .map(s => `dc=${s}`)
  .join(',');

/*
 * Default options
 */
const defaults = {
  hostname: 'localhost',
  port: 389,
  bind: {
    domain: 'example.org'
  }
};

/*
 * Authentication adapter
 */
module.exports = (core, opts = {}) => {
  const settings = core.config('ldap', opts);
  const options = merge({}, defaults, settings);
  const client = new Client({
    url: `ldap://${options.hostname}:${options.port}`
  });

  const login = async (req) => {
    const {username, password} = req.body;
    const {domain} = options.bind || {};
    const dn = `cn=${cleanUsername(username)},${createDcs(domain)}`;

    try {
      await client.bind(dn, password);

      const {searchEntries} = await client.search(dn);
      if (searchEntries.length === 1) {
        const [profile] = searchEntries;

        return {
          username,
          id: profile.uid,
          name: profile.givenName,
          dn: profile.dn,
          groups: []
        };
      }
    } catch (e) {
      console.error(e);
    } finally {
      await client.unbind();
    }

    return false;
  };

  return {login};
};
