(function( $ ) {
	"use strict";
    var pluginName = 'clickToEdit';
    var defaults = {
            confirmRemove: null,
            postSuccess: null,
            postFail: null,
			matchOptionsByText: false,
			displayTitle: 'click to edit'
        };
		
	// The actual plugin constructor
    function ClickToEdit(element, options) {
        this.element = element;
		this.$element = null;
        this.options = $.extend({}, defaults, options);
        this._defaults = defaults;
        this._name = pluginName;
		this.type='text';
		this._text='';
		this.url='';

        this.init();
    }
	
	
	
	ClickToEdit.prototype.init = function () {
        this.$element = $(this.element);
		this.type = this.$element.attr("data-fieldtype").toLowerCase();
        
		var wap = $("<div class='clickToEdit_wap'>").append($("<span>").html(this.$element.html())).append($("<span class='edit-icon fa fa-pencil'>"));//
		//wap = wap.after($("<span class='aui-icon edit fa fa-pencil'>"));
		this.$element.empty().append(wap);
		wap.on("click", $.proxy(this.editMode, this));

		if(this.options.displayTitle.length > 0){
			this.$element.prop('title', this.options.displayTitle);
		}
    };
	
	ClickToEdit.prototype.editMode = function() {
		var options = this.options;
		this._text = this.$element.text();
		debug('editMode......._text:::.'+this._text);
		/*var $form= initform();
		if(this.type=='text'){
			$form.find(".field-group").append(initfield().val(this.$element.text()));
		}
		$form.append(initbtns());

		this.$element.append($form);*/


		var $form=this.initform();
		this.$element.append($form);


		this.$element.find(".clickToEdit_wap").hide();

		$form.find(".text").focus();

		// INIT EVENT.
		var submitForm = $.proxy(this.submitForm, this);
		var cancelEdit = $.proxy(this.cancelEdit, this);

		$form.on('click', '.cancel', cancelEdit);
        $form.on('submit', submitForm);
		$form.find("input, textarea, select").on('blur', $.proxy(this.leaveEdit, this));//失去焦点提交数据
		
		//***********************************initData*****************************
		var url = this.$element.data("data-url");
		var $this = this;
		if(this.type=='select' && url && url.length>0){
			this.$element.find("button[type='submit'] span").removeClass("fa fa-check").addClass("loading_smart");
			$form.find("select").append($("<option>").text($this._text));//暂时显示原来的值，因为AJAX请求数据要花很长时间
			$.getJSON({
				url: url,
				success: function(data){
					var data = data.data;
					$form.find("button[type='submit'] span").removeClass("loading_smart").addClass("fa fa-check");
					if(data && data.length>0){
						$form.find("select").empty();
						$.each(data, function(i, e){
							var option = $("<option>").val(e.key).text(e.value);
							if(e.value==$this._text){
								option.attr("selected", "selected");
							}
							$form.find("select").append(option);
						});						
					}
				}
			});
		}

	};

	ClickToEdit.prototype.leaveEdit = function(e) {//离开编辑 失去焦点
		debug('leaveEdit........');
		if(this._text == this.$element.find("input").val()){
			debug('数值没有变化，不做任何处理.......');
			this.$element.find(".clickToEdit_wap").text(this.$element.find('input').val()).show();
			this.$element.find("form").remove();
			return;
		}
		//如果值有变化则提交
		this.$element.find("form button").attr('disabled',"disabled");//失去焦点将按钮设置为不可用，因为再次点击将重复提交数据
		this.$element.find("form").submit();
	};

	ClickToEdit.prototype.cancelEdit = function(e) {
		debug('cancelEdit........');
		this.$element.find(".clickToEdit_wap span:first").text(this.$element.find('input').val()).show();
		this.$element.find(".clickToEdit_wap").show();
		this.$element.find("form").remove();
		
	};

	ClickToEdit.prototype.submitForm = function(e) {
		debug('submitForm........');
		if(this._text == this.$element.find("input").val()){
			debug('数值没有变化，不做任何处理.......');
			this.$element.find(".clickToEdit_wap").text(this._text).show();
			this.$element.find("form").remove();
		}else{

			this.$element.find("button[type='submit'] span").removeClass("fa fa-check").addClass("loading_smart");
			this.$element.find('.text').addClass("uneditable").attr('disabled',"disabled");
			this.$element.find("form button").attr('disabled',"disabled");

			var afterSuccess = $.proxy(this.editSuccess, this);
			var onError = $.proxy(this.ajaxError, this);
			var form = $(e.currentTarget);
			
			$.ajax({
				url: form[0].action,
				type: form[0].method,
				context: form,
				data: form.serialize(),
				success: afterSuccess,
				error: onError
			});

		}

		e.preventDefault();
		return false;
	};


	ClickToEdit.prototype.editSuccess = function(data) {
		debug('editSuccess........');
		//after a successful edit form post, update the display element, 
		//and close the edit mode
		
		var val = this.$element.find('.text').val();
		if(this.type=='select'){
			val = this.$element.find('.text option:selected').text();
		}

		this.$element.find(".clickToEdit_wap span:first").text(val).show();
		this.$element.find(".clickToEdit_wap").show();
		this.$element.find("form").remove();
		
		//fire post success function if it was configured
		if (this.options.postSuccess !== null && $.isFunction(this.options.postSuccess)) {
			this.options.postSuccess(this.$element, data);
		}
	};

	ClickToEdit.prototype.ajaxError = function(jqXHR, text, errThrown) {
		debug('ajaxError........');
		//if configured, call a postFail function if ajax call fails
		$(".btn-group button[type='submit']").removeClass("loading_smart").addClass("loading_smart").add();
		this.$element.find('.text').addClass("uneditable").removeAttr('disabled');
		this.$element.find("form button").removeAttr('disabled');

		if (this.options.postFail !== null && $.isFunction(this.options.postFail)) {
			this.options.postFail(this.$element, jqXHR, text, errThrown);
		}
	};

	ClickToEdit.prototype.initform = function(){
		var $this = this;
		var $form = $("<form>").attr("id", "form-0012").addClass("tclass").attr("action", "/dummy/url").attr("method","post")
		.append($("<div>").addClass("inline-edit-fields").append($("<div>").addClass("field-group")));

		var $btns = $("<div class='btn-group'><button type='submit'><span class='fa fa-check'/></button><button type='button' class='cancel'><span class='fa  fa-times'/></button></div>");

		var $field = "";
		switch(this.type){
			case 'text':
				$field = $("<input type='text'>").addClass("text long-field edit_wap").attr("id", "11112221111").attr("name", "field_text_name");
				$field.val($this.$element.text());
			break;
			case 'textarea':
				$field = $("<textarea rows='5'>").addClass("text long-field edit_wap").attr("id", "11112221112").attr("name", "field_textarea_name");
				$field.val($this.$element.text());
			break;
			case 'select':
				$field = $("<select>").addClass("text long-field edit_wap").attr("id", "11112221113").attr("name", "field_select_name");
				var option_data = this.$element.data("alldata");
				if(option_data && option_data.length>0){
					$.each(option_data, function(i, e){
						var option = $("<option>").val(e.key).text(e.value);
						debug("e.value::"+e.value +" $this._text::"+$this._text);
						if(e.value==$this._text){
							option.attr("selected", "selected");
						}
						$field.append(option);
					});
				}


			break;
			default:
				$field = $("<input type='text'>").addClass("text long-field edit_wap").attr("id", "11112221111").attr("name", "field_text_name");
		}

		$form.find(".field-group").append($field);

		return $form.append($btns);
	}
	
	 // preventing against multiple instantiations
    $.fn[pluginName] = function (options) {
        return this.each(function (i, ele) {
            if (!$(this).data('plugin_' + pluginName)) {
                $(this).data('plugin_' + pluginName,  new ClickToEdit(this, options));
            }
        });
    };
	
	var debug = function(message) {
		if(window.console && window.console.log) {
			console.log(message);
		} else {
			alert(message);
		}
	}; 
}( jQuery ));
