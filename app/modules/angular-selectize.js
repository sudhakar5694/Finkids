/*
* Angular Selectize
* v 1.2.3
* https://github.com/machineboy2045/angular-selectize
*/

/*global $:Selectize */

angular
    .module('selectize', [])
    .value('selectizeConfig', {})
    .directive("selectize", [
        'selectizeConfig',
        '$timeout',
        function (selectizeConfig,$timeout) {
            return {
                restrict: 'EA',
                require: '^ngModel',
                scope: {
                    ngModel: '=',
                    config: '=?',
                    options: '=?',
                    ngDisabled: '=',
                    ngRequired: '&'
                },
                link: function (scope, element, attrs, modelCtrl) {
                    if (!Selectize) {
                        throw new Error("Selectize JavaScript library should be loaded before using this angular module.");
                    }

                    // Drag & Drop
                    Selectize.define('drag_drop', function(options) {
                        if (!$.fn.sortable) throw new Error('The "drag_drop" plugin requires jQuery UI "sortable".');
                        if (this.settings.mode !== 'multi') return;
                        var self = this;

                        self.lock = (function() {
                            var original = self.lock;
                            return function() {
                                var sortable = self.$control.data('sortable');
                                if (sortable) sortable.disable();
                                return original.apply(self, arguments);
                            };
                        })();

                        self.unlock = (function() {
                            var original = self.unlock;
                            return function() {
                                var sortable = self.$control.data('sortable');
                                if (sortable) sortable.enable();
                                return original.apply(self, arguments);
                            };
                        })();

                        self.setup = (function() {
                            var original = self.setup;
                            return function() {
                                original.apply(this, arguments);

                                var $control = self.$control.sortable({
                                    items: '[data-value]',
                                    forcePlaceholderSize: true,
                                    disabled: self.isLocked,
                                    start: function(e, ui) {
                                        ui.placeholder.css('width', ui.helper.css('width'));
                                        $control.css({overflow: 'visible'});
                                    },
                                    stop: function() {
                                        $control.css({overflow: 'hidden'});
                                        var active = self.$activeItems ? self.$activeItems.slice() : null;
                                        var values = [];
                                        $control.children('[data-value]').each(function() {
                                            values.push($(this).attr('data-value'));
                                        });
                                        self.setValue(values);
                                        self.setActiveItem(active);
                                    },
                                    helper: function(event, ui){
                                        var $clone =  $(ui).clone();
                                        $clone .css('position','absolute');
                                        return $clone.get(0);
                                    }
                                });
                            };
                        })();

                    });

                    // remove button
                    Selectize.define('remove_button', function(options) {
                        options = $.extend({
                            label     : '&times;',
                            title     : 'Remove',
                            className : 'remove',
                            append    : true
                        }, options);

                        var escape_html = function(str) {
                            return (str + '')
                                .replace(/&/g, '&amp;')
                                .replace(/</g, '&lt;')
                                .replace(/>/g, '&gt;')
                                .replace(/"/g, '&quot;');
                        };

                        var singleClose = function(thisRef, options) {

                            console.log(thisRef);

                            options.className = options.className || 'remove-single';

                            var self = thisRef;
                            var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';

                            /**
                             * Appends an element as a child (with raw HTML).
                             *
                             * @param {string} html_container
                             * @param {string} html_element
                             * @return {string}
                             */
                            var append = function(html_container, html_element) {
                                var pos = html_container.search(/(<\/[^>]+>\s*)$/);
                                return html_container.substring(0, pos) + html_element + html_container.substring(pos);
                            };

                            thisRef.setup = (function() {
                                var original = self.setup;
                                return function() {
                                    // override the item rendering method to add the button to each
                                    if (options.append) {
                                        var id = $(self.$input.context).attr('id');
                                        var selectizer = $('#'+id);

                                        var render_item = self.settings.render.item;
                                        self.settings.render.item = function(data) {
                                            return append(render_item.apply(thisRef, arguments), html);
                                        };
                                    }

                                    original.apply(thisRef, arguments);

                                    // add event listener
                                    thisRef.$control.on('click', '.' + options.className, function(e) {
                                        e.preventDefault();
                                        if (self.isLocked) return;

                                        self.clear();
                                    });

                                };
                            })();
                        };

                        var multiClose = function(thisRef, options) {

                            var self = thisRef;
                            var html = '<a href="javascript:void(0)" class="' + options.className + '" tabindex="-1" title="' + escape_html(options.title) + '">' + options.label + '</a>';

                            /**
                             * Appends an element as a child (with raw HTML).
                             *
                             * @param {string} html_container
                             * @param {string} html_element
                             * @return {string}
                             */
                            var append = function(html_container, html_element) {
                                var pos = html_container.search(/(<\/[^>]+>\s*)$/);
                                return html_container.substring(0, pos) + html_element + html_container.substring(pos);
                            };

                            thisRef.setup = (function() {
                                var original = self.setup;
                                return function() {
                                    // override the item rendering method to add the button to each
                                    if (options.append) {
                                        var render_item = self.settings.render.item;
                                        self.settings.render.item = function(data) {
                                            return append(render_item.apply(thisRef, arguments), html);
                                        };
                                    }

                                    original.apply(thisRef, arguments);

                                    // add event listener
                                    thisRef.$control.on('click', '.' + options.className, function(e) {
                                        e.preventDefault();
                                        if (self.isLocked) return;

                                        var $item = $(e.currentTarget).parent();
                                        self.setActiveItem($item);
                                        if (self.deleteSelection()) {
                                            self.setCaret(self.items.length);
                                        }
                                    });

                                };
                            })();
                        };

                        if (this.settings.mode === 'single') {
                            singleClose(this, options);
                            return;
                        } else {
                            multiClose(this, options);
                        }
                    });

                    Selectize.defaults.maxItems = null; //default to tag editor
                    Selectize.defaults.hideSelected = true;

                    if(attrs.position) {
                        scope.posBottom = attrs.position;
                    }

                    Selectize.defaults.onDropdownOpen = function($dropdown) {
                        $dropdown
                            .hide()
                            .velocity('slideDown', {
                                begin: function() {
                                    if (typeof scope.posBottom !== 'undefined') {
                                        $dropdown.css({'margin-top':'0'})
                                    }
                                },
                                duration: 200,
                                easing: [ 0.4,0,0.2,1 ]
                            })
                    };
                    Selectize.defaults.onDropdownClose = function($dropdown) {
                        $dropdown
                            .show()
                            .velocity('slideUp', {
                                complete: function() {
                                    if (typeof posBottom !== 'undefined') {
                                        $dropdown.css({'margin-top': ''})
                                    }
                                },
                                duration: 200,
                                easing: [ 0.4,0,0.2,1 ]
                            });
                    };

                    Selectize.defaults.onChange = function() {
                        if(!!$(element).attr('data-parsley-id')) {
                            $(element).parsley().validate();
                        }
                    };

                    Selectize.defaults.onInitialize = function() {
                        if($(element)[0].selectize.isRequired) {
                            $timeout(function() {
                                $(element).prop('required', true);
                            });
                        }
                    };

                    var selectize,
                        config = angular.extend({}, Selectize.defaults, selectizeConfig, scope.config);

                    modelCtrl.$isEmpty = function (val) {
                        return (val === undefined || val === null || !val.length); //override to support checking empty arrays
                    };

                    function createItem(input) {
                        var data = {};
                        data[config.labelField] = input;
                        data[config.valueField] = input;
                        return data;
                    }

                    function toggle(disabled) {
                        disabled ? selectize.disable() : selectize.enable();
                    }

                    var validate = function () {
                        var isInvalid = (scope.ngRequired() || attrs.required || config.required) && modelCtrl.$isEmpty(scope.ngModel);
                        modelCtrl.$setValidity('required', !isInvalid);
                    };

                    function generateOptions(data) {
                        if (!data)
                            return [];

                        data = angular.isArray(data) ? data : [data];

                        return $.map(data, function (opt) {
                            return typeof opt === 'string' ? createItem(opt) : opt;
                        });
                    }

                    function updateSelectize() {
                        validate();

                        selectize.$control.toggleClass('ng-valid', modelCtrl.$valid);
                        selectize.$control.toggleClass('ng-invalid', modelCtrl.$invalid);
                        selectize.$control.toggleClass('ng-dirty', modelCtrl.$dirty);
                        selectize.$control.toggleClass('ng-pristine', modelCtrl.$pristine);

                        var value = selectize.items.slice();
                        if (config.maxItems === 1) {
                            value = value[0];
                        }
                        if (!angular.equals(value, scope.ngModel)) {
                            selectize.addOption(generateOptions(scope.ngModel));
                            selectize.setValue(scope.ngModel);
                        }
                    }

                    var onChange = config.onChange,
                        onOptionAdd = config.onOptionAdd;

                    config.onChange = function () {
                        var args = arguments;
                        scope.$evalAsync(function () {
                            var value = selectize.items.slice();
                            if (config.maxItems === 1) {
                                value = value[0];
                            }
                            if (!angular.equals(value, scope.ngModel)) {
                                modelCtrl.$setViewValue(value);
                                if (onChange) {
                                    onChange.apply(this, args);
                                }
                            }
                        });
                    };

                    config.onOptionAdd = function (value, data) {
                        if (scope.options.indexOf(data) === -1)
                            scope.options.push(data);

                        if (onOptionAdd) {
                            onOptionAdd.apply(this, arguments);
                        }
                    };

                    // ngModel (ie selected items) is included in this because if no options are specified, we
                    // need to create the corresponding options for the items to be visible
                    //scope.options = generateOptions((scope.options || config.options || scope.ngModel).slice());

                    scope.generatedOptions = generateOptions( (scope.options || config.options || scope.ngModel).slice() );
                    scope.options.length = 0;
                    scope.generatedOptions.forEach(function (item) {
                        scope.options.push(item);
                    });


                    var angularCallback = config.onInitialize;

                    config.onInitialize = function () {
                        selectize = element[0].selectize;
                        //selectize.addOption(scope.options);
                        selectize.addOption(scope.generatedOptions);
                        selectize.setValue(scope.ngModel);

                        //provides a way to access the selectize element from an
                        //angular controller
                        if (angularCallback) {
                            angularCallback(selectize);
                        }

                        scope.$watch('options', function () {
                            scope.generatedOptions = generateOptions( (scope.options || config.options || scope.ngModel).slice() );
                            scope.options.length = 0;
                            scope.generatedOptions.forEach(function (item) {
                                scope.options.push(item);
                            });
                            selectize.clearOptions();
                            selectize.addOption(scope.generatedOptions);
                            selectize.setValue(scope.ngModel);
                            //selectize.clearOptions();
                            //selectize.addOption(scope.options);
                            //selectize.setValue(scope.ngModel);
                        }, true);

                        scope.$watchCollection('ngModel', updateSelectize);
                        scope.$watch('ngDisabled', toggle);
                    };

                    element.after('<div class="selectize_fix"></div>');

                    element.selectize(config);

                    element.on('$destroy', function () {
                        if (selectize) {
                            selectize.destroy();
                            element = null;
                        }
                    });
                }
            };
        }
    ]);

    // tooltip
    Selectize.define('tooltip', function (options) {
        var self = this;
        this.setup = (function () {
            var original = self.setup;
            return function () {
                original.apply(this, arguments);
                var $wrapper = this.$wrapper,
                    $input = this.$input;
                if ($input.attr('title')) {
                    $wrapper
                        .attr('title', $input.attr('title'))
                        .attr('data-uk-tooltip', $input.attr('data-uk-tooltip'));
                }
            };
        })();
    });

    // disable option
    // https://github.com/mondorobot/selectize-disable-options
    Selectize.define('disable_options', function(options) {
        var self = this;

        options = $.extend({
            'disableOptions': []
        }, options);

        self.onFocus = (function() {
            var original = self.onFocus;

            return function() {
                original.apply(this, arguments);

                $.each(options.disableOptions, function(index, option) {
                    self.$dropdown_content.find('[data-value="' + String(option) + '"]').addClass('option-disabled');
                });
            };
        })();

        self.onOptionSelect = (function() {
            var original = self.onOptionSelect;

            return function(e) {
                var value, $target, $option;

                if (e.preventDefault) {
                    e.preventDefault();
                    e.stopPropagation();
                }

                $target = $(e.currentTarget);

                if ($target.hasClass('option-disabled')) {
                    return;
                } else if ($target.hasClass('create')) {
                    self.createItem();
                } else {
                    value = $target.attr('data-value');
                    if (value) {
                        self.lastQuery = null;
                        self.setTextboxValue('');
                        self.addItem(value);
                        if (!self.settings.hideSelected && e.type && /mouse/.test(e.type)) {
                            self.setActiveOption(self.getOption(value));
                        }
                    }

                    self.blur();
                }
                return original.apply(this, arguments);
            };
        })();
    });