describe("Script library function", function() {
    describe(".parseCargoFeatures()", async function() {
        let inputs = [
            [`<div><pre><code>
                [features]
                rt = [&quot;stm32f30x-hal/rt&quot;]
              </code></pre></div>`,
                [["rt", "[&quot;stm32f30x-hal/rt&quot;]"]]
            ],
            [`<div><pre><code>
                [features]
                rt = [&quot;stm32f30x-hal/rt&quot;]
                
              </code></pre></div>`,
                [["rt", "[&quot;stm32f30x-hal/rt&quot;]"]]
            ],
            [`<div><pre><code>
              </code></pre></div>`,
                []
            ],
            [`<div><pre><code>
                [features]
              </code></pre></div>`,
                []
            ],
            [`<div><pre><code>
                [package]
                authors = ""
              </code></pre></div>`,
                []
            ],
            [`<div><pre><code>
                [features]
                tls = [&quot;sqlx-core/tls&quot;]
                uuid = [&quot;sqlx-core/uuid&quot;, &quot;sqlx-macros/uuid&quot;]
              </code></pre></div>`,
                [["tls", "[&quot;sqlx-core/tls&quot;]"], ["uuid", "[&quot;sqlx-core/uuid&quot;, &quot;sqlx-macros/uuid&quot;]"]]
            ],
            [`<div><pre><code>
                [features]
                tls = [&quot;sqlx-core/tls&quot;]
                uuid = [&quot;sqlx-core/uuid&quot;, &quot;sqlx-macros/uuid&quot;]
                
                [package]
                authors = []
              </code></pre></div>`,
                [["tls", "[&quot;sqlx-core/tls&quot;]"], ["uuid", "[&quot;sqlx-core/uuid&quot;, &quot;sqlx-macros/uuid&quot;]"]]
            ],
            [`<div><pre><code>
                [features]
                tls = [&quot;sqlx-core/tls&quot;]
                uuid = [&quot;sqlx-core/uuid&quot;, &quot;sqlx-macros/uuid&quot;]
                default = []
                
                [package]
                authors = ""
              </code></pre></div>`,
                [["tls", "[&quot;sqlx-core/tls&quot;]"], ["uuid", "[&quot;sqlx-core/uuid&quot;, &quot;sqlx-macros/uuid&quot;]"], ["default", "[]"]]
            ],
        ];
        inputs.forEach(([content, expected], number) => {
            it(`Parse crate feature flags #${number}`, function() {
                let features = parseCargoFeatures(content);
                features.should.has.lengthOf(expected.length);
                features.should.deep.equal(expected);
            });
        });
    });
});