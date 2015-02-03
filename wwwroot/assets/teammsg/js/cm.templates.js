CM.templates={
		onStart: function() {
    	    CM.templates.load();
    	    CM.templates.registerPartials();
          CM.templates.helpers.onStart();
          CM.templates.builders.onStart();
    	    //CM.members.user_color_changed_sig.add(CM.templates.memberUserColorChanged, CM.templates);
    	    //CM.prefs.sidebar_behavior_changed_sig.add(CM.templates.sidebarBehaviorPrefChanged, CM.templates)
    	}, 
    	generic_dialog_template: '		<div class="modal-header">			<button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>			<h3>{{{title}}} <img src="/img/loading.gif" width="16" height="16" class="throbber hidden"></h3>		</div>		<div class="modal-body" style="overflow-x: hidden;">			{{{body}}}		</div>		<div class="modal-footer">			<a style="cursor: pointer" class="btn btn-outline btn_outline dialog_cancel"></a>			<a style="cursor: pointer" class="btn btn dialog_secondary_go hidden"></a>			<a style="cursor: pointer" class="btn dialog_go"></a>		</div>		',
    	generic_dialog_sample_template: '		<p><a class="btn btn-small" onclick="CM.generic_dialog.cancel(); $(\'#file-upload\').trigger(\'click\');">Choose a file</a> 		OR <a class="btn btn-small" hhref="/files/create/snippet" target="{{newWindowName}}" onclick="CM.ui.snippet_dialog.startCreate(); CM.generic_dialog.cancel();">Create a text file</a></p>		', 
    	existing_groups_template: '		{{#if_equal existing_groups.length compare=1}}			The following group has the same members as the one you are trying to create. Would you like to use it instead?<br><br>		{{else}}			The following groups have the same members as the one you are trying to create. Would you like to use one of them instead?<br><br>		{{/if_equal}}		{{#each existing_groups}}			<p class="small_bottom_margin" style="font-size:0.8rem; color:black"><span style="color: #AAA;">{{{groupPrefix}}}</span>{{this.name}}&nbsp;&nbsp;<a onclick="CM.ui.group_create_dialog.useExistingGroup(\'{{this.id}}\')" class="btn btn-mini btn-primary">{{#if this.is_archived}}unarchive{{else}}open{{/if}}</a></p>		{{/each}}		<br>		If you really want to create a new group, just click the "create new group" button again.		', 
    	issue_list_item_template: '		<div class="issue_list_div issue_{{issue.state}}" id="{{makeIssueListDomId issue.id}}" data-issue-id="{{issue.id}}">			<div class="issue_list_left">				<div class="issue_list_title">{{issue.title}}</div>				<div class="issue_list_short_text">{{issue.short_text}}</div>			</div>			<div class="issue_list_right">				<div class="issue_list_state">{{issue.state}}{{#if_equal issue.state compare="unread"}} <i class="fa fa-exclamation-circle icon"></i>{{/if_equal}}</div>				<div class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort issue.ts}} at {{toTime issue.ts}}</div>			</div>		</div>		', 
    	help_issue_div_template: '		<p class="small_bottom_margin"><b>{{issue.title}}</b></p>		{{#if show_comments}}			{{#each issue.comments}}				<div class="issue_comment_div">					<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>					{{{formatMessageSimple this.text}}}				</div>			{{/each}}		{{else}}			<div class="issue_comment_div">			</div>		{{/if}}		', 
    	help_issue_reply_comments_template: '		{{#each issue.comments}}			<div class="issue_comment_div">				<p class="small_bottom_margin"><b>{{this.from}}</b> <span class="issue_list_short_ts">{{toCalendarDateOrNamedDayShort this.ts}} at {{toTime this.ts}}</span></p>				{{{formatMessageSimple this.text}}}			</div>		{{/each}}		', 
    	message_attachment_template: '		{{{initial_caret_html}}}		<div {{#if real_src}}data-real-src="{{real_src}}"{{/if}} class="inline_attachment{{#unless expand_it}} hidden{{/unless}} {{max_width_class}}">			{{#if attachment.pretext}}				<div class="attachment_pretext">{{{formatMessageAttachmentPart attachment.pretext msg true attachment.mrkdwn_in_hash.pretext}}}</div>			{{/if}}			<div class="inline_attachment_wrapper{{#if is_standalone}} standalone{{/if}}">				<div class="attachment_bar" style="background:#{{bg_color}};"><div class="shim"></div></div>				<div class="content dynamic_content_max_width">										{{#if thumb_at_top}}					{{#if small_thumb}}						<div class="msg_inline_attachment_thumb_holder at_top">							{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}							{{!using style for width height is important! we must override default img styles}}							<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">							{{#if thumb_link}}</a>{{/if}}						</div>					{{/if}}					{{/if}}										{{#if can_delete}}						<div class="delete_attachment_link" data-attachment-id="{{attachment.id.id.id}}"><i class="fa fa-times"></i></div>					{{/if}}										<div>						{{#if attachment.service_icon}}<img class="attachment_service_icon" src="{{attachment.service_icon}}" width="16" height="16">{{/if}}						{{#if attachment.author_icon}}							<img class="attachment_author_icon" src="{{attachment.author_icon}}" width="16" height="16">							<a{{#if attachment.author_link}} {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"{{/if}}><span class="attachment_author_name">{{{formatMessageAttachmentPart attachment.author_name msg false false}}}</span></a>							<a{{#if attachment.author_link}} {{{makeRefererSafeLink url=attachment.author_link}}} target="{{attachment.author_link}}"{{/if}}><span class="attachment_author_subname">{{{formatMessageAttachmentPart attachment.author_subname msg false false}}}</span></a>						{{else}}							{{#if attachment.service_url}}								<a {{{makeRefererSafeLink url=attachment.service_url}}} target="{{attachment.service_url}}"><span class="attachment_service_name">{{{formatMessageAttachmentPart attachment.service_name msg false false}}}</span></a>							{{else}}								<span class="attachment_service_name">{{{formatMessageAttachmentPart attachment.service_name msg false false}}}</span>							{{/if}}						{{/if}}						{{#unless attachment.title}}{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}{{/unless}}					</div>										{{#unless thumb_at_top}}					{{#if small_thumb}}						<div class="msg_inline_attachment_thumb_holder">							{{#if thumb_link}}<a {{{makeRefererSafeLink url=thumb_link}}} target="{{thumb_link}}">{{/if}}							{{!using style for width height is important! we must override default img styles}}							<img class="msg_inline_attachment_thumb" src="{{small_thumb_url}}" style="width:{{attachment._floated_thumb_display_width}}px; height:{{attachment._floated_thumb_display_height}}px;">							{{#if thumb_link}}</a>{{/if}}						</div>					{{/if}}					{{/unless}}										{{#unless attachment.author_icon}}						<div class="attachment_author_name">{{{formatMessageAttachmentPart attachment.author_name msg false false}}}</div>					{{/unless}}										{{#if attachment.title}}						<div>							{{#if attachment.title_link}}								<span class="attachment_title"><a {{{makeRefererSafeLink url=attachment.title_link}}} target="{{attachment.title_link}}">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</a></span>							{{else}}								<span class="attachment_title">{{{formatMessageAttachmentPart attachment.title msg true false enable_slack_action_links}}}</span>							{{/if}}							{{#unless attachment.text}}{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}{{/unless}}						</div>					{{/if}}										{{#if attachment.text}}						<div class="attachment_contents">							{{#if is_text_collapsed}}								<span class="short_text" data-all-text="{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text}}">{{{formatMessageAttachmentPart attachment._short_text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}</span>								<span id="{{makeMsgAttachmentTextExpanderDomId msg.ts attachment._index}}" class="rest_text_expander"> <a>Show more...</a></span>							{{else}}								{{{formatMessageAttachmentPart attachment.text msg true attachment.mrkdwn_in_hash.text enable_slack_action_links}}}							{{/if}}							{{#unless attachment.fields}}{{{media_caret_html}}}{{/unless}}						</div>						{{#if attachment.footer}}<div class="attachment_footer">							{{{formatMessageAttachmentPart attachment.footer msg true attachment.mrkdwn_in_hash.footer enable_slack_action_links}}}						</div>{{/if}}						{{#if attachment.ts}}<div class="attachment_ts">							{{#if ts_link}}<a {{{makeRefererSafeLink url=ts_link}}} target="{{ts_link}}">{{/if}}							{{toCalendarDateOrNamedDayShort attachment.ts}} at {{toTime attachment.ts}}							{{#if ts_link}}</a>{{/if}}						</div>{{/if}}					{{/if}}										{{#if attachment.fields}}						<div class="attachment_fields">						{{#if show_fields_table}}							<table class="" cellpadding="0" cellspacing="0" border="0" align="left"><tbody>							{{#foreach attachment.fields}}								{{#if this.value._new_row}}<tr>{{/if}}								<td valign="top" colspan="{{#if this.value.short}}1{{else}}2{{/if}}" {{#if this.value.short}}{{#if this.value._new_row}}width="250"{{/if}}{{/if}}>									<div class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</div>									<i class="copy_only">----------------<br></i>									<div class="attachment_field_value {{#if this.value.short}}short{{/if}}">{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}<i class="copy_only"><br><br></i></div>								</td>							{{/foreach}}							</tbody></table>						{{else}}							{{#foreach long_fields}}								<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields}}}<br>							{{/foreach}}							{{#foreach short_fields}}								{{#unless this.first}}&nbsp;&nbsp;閳?nbsp;&nbsp;{{/unless}}<span class="attachment_field_title">{{{formatMessageAttachmentPart this.value.title msg false false}}}</span>&nbsp;&nbsp;&nbsp;{{{formatMessageAttachmentPart this.value.value msg true ../attachment.mrkdwn_in_hash.fields ../enable_slack_action_links}}}							{{/foreach}}						{{/if}}						</div>						{{{media_caret_html}}}					{{/if}}										{{#if attachment.video_html}}						{{#if attachment.thumb_url}}							{{#if attachment.from_url}}								{{{inlineVideoDiv attachment.from_url msg_dom_id expand_media}}}							{{else}}								{{{inlineVideoDiv attachment.thumb_url msg_dom_id expand_media}}}							{{/if}}						{{/if}}					{{else}}					{{/if}}										{{#if attachment.image_url}}						{{#if attachment.from_url}}							{{{inlineImgDiv attachment.from_url msg_dom_id expand_media}}}						{{else}}							{{{inlineImgDiv attachment.image_url msg_dom_id expand_media}}}						{{/if}}					{{/if}}										{{#if attachment.audio_html}}						{{{inlineAudioDiv attachment.audio_html msg_dom_id attachment.audio_html expand_media}}}					{{else}}						{{#if attachment.audio_url}}							{{{formatSoundUrl attachment}}}						{{/if}}					{{/if}}										{{#if show_action_links}}					{{#if attachment.actions}}						<div class="attachment_actions">						{{#foreach attachment.actions}}							{{{formatActionLink this.value msg ../enable_slack_action_links}}}							{{#unless this.last}} 閳?{{/unless}}						{{/foreach}}						</div>					{{/if}}					{{/if}}				</div>			</div>		</div>		{{#if show_fallback}}<div class="attachment_fallback">{{#if attachment.fallback}}{{{formatMessageAttachmentPart attachment.fallback msg true attachment.mrkdwn_in_hash.fallback enable_slack_action_links}}}{{else}}NO FALLBACK PROVIDED{{/if}}</div>{{/if}}		', 
    	file_snippet_reference_template: '<div class="file_reference">{{#isTheme theme="dense"}}	<div class="meta">		{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} snippet: 		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>		<a href="{{file.permalink}}" target="{{file.permalink}}" class="fa fa-external-link-square icon_new_window" title="Open file page"></a>	</div>	{{#unless standalone}}		<div class="snippet_preview">			{{{file.preview_highlight}}}			{{#if_gt file.lines_more compare=0}}				<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>			{{/if_gt}}		</div>		<div class="snippet_meta">			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>			<span class="bullet">閳?/span>			{{#memberIsSelf id=member.id}} 				{{#unless uploader}}					<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="CM.ui.snippet_dialog.startEdit(\'{{file.id}}\'); return false">Edit</a> <span class="bullet">閳?/span>				{{/unless}}			{{/memberIsSelf}}			<a href="{{file.permalink}}" target="{{file.id}}">New window</a>			<span class="bullet">閳?/span> 			<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>			<span class="bullet">閳?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		</div>	{{/unless}}	{{/isTheme}}		{{#isTheme theme="light"}}	<span class="meta">		{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} snippet: 		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>	</span><br />	{{#unless standalone}}		<div class="snippet_preview">			{{{file.preview_highlight}}}			{{#if_gt file.lines_more compare=0}}				<a href="{{file.permalink}}" data-file-id="{{file.id}}" class="file_preview_link snippet_preview_more" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}">+ {{file.lines_more}} more line{{#if_gt file.lines_more compare=1}}s{{/if_gt}}...</a>			{{/if_gt}}		</div>		<span class="meta block snippet_meta">			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>			<span class="bullet">閳?/span> 			{{#memberIsSelf id=member.id}} 				{{#unless uploader}}					<a href="{{file.edit_link}}" target="{{file.id}}" class="file_edit" onclick="CM.ui.snippet_dialog.startEdit(\'{{file.id}}\'); return false">Edit</a> <span class="bullet">閳?/span>				{{/unless}}			{{/memberIsSelf}}			<a href="{{file.permalink}}" target="{{file.id}}">New window</a>			<span class="bullet">閳?/span> 			<a href="{{file.url_private}}" target="{{file.id}}">View raw</a>			<span class="bullet">閳?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		</span>	{{/unless}}	{{/isTheme}}</div>', 
    	file_post_reference_template: '<div class="file_reference">	{{#isTheme theme="dense"}}		<div class="post_meta">			{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} post: 			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_name bold">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			<a href="{{file.permalink}}" target="{{file.permalink}}" class="fa fa-external-link-square icon_new_window" title="Open file page"></a><br />		</div>		{{#unless standalone}}			<div class="post_preview">				{{{nl2br file.preview}}}				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>			</div>			<span class="meta block post_meta">				{{#memberIsSelf id=member.id}} 					{{#unless uploader}}						<a href="{{file.permalink}}/edit">Edit</a>						<span class="bullet">閳?/span>					{{/unless}}				{{/memberIsSelf}}				<a href="{{file.permalink}}" target="{{file.id}}">New window</a>				<span class="bullet">閳?/span>				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">					{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}				</a>			</span>		{{/unless}}	{{/isTheme}}		{{#isTheme theme="light"}}		<span class="meta">			{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}\'s{{else}}a{{/if}} post: 			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			<a href="{{file.permalink}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open post in a new tab"><i class="fa fa-external-link-square file_inline_icon"></i></a>		</span>		{{#unless standalone}}			<div class="post_preview">				{{{nl2br file.preview}}}				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link">more</a>			</div>			<span class="meta block post_meta">				{{#memberIsSelf id=member.id}} 					{{#unless uploader}}						<a href="{{file.permalink}}/edit">Edit</a>						<span class="bullet">閳?/span>					{{/unless}}				{{/memberIsSelf}}				<a href="{{file.permalink}}" target="{{file.id}}">New window</a>				<span class="bullet">閳?/span>				<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">					{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}				</a>			</span>		{{/unless}}	{{/isTheme}}</div>', 
    	file_reference_template: '<div class="file_reference">{{#isTheme theme="dense"}}	<!--	<em>		{{{makeMemberPreviewLink member}}} referenced:		{{#if uploader}}			{{{makeMemberPreviewLink uploader}}}{{possessive uploader.name}} file:		{{/if}}	</em>	<a href="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" target="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" class="fa fa-external-link-square icon_new_window" title="{{#if file.is_external}}Open original in new tab{{else}}Open file page{{/if}}"></a>	-->	<div class="file_details">		{{#if file.is_external}}			<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file.id}}" class="icon icon_40 {{icon_class}}" title="Open original in new tab">		{{else}}			{{#fileIsImage id=file.id}}				<a href="{{file.url}}" {{#isClient}}target="{{file.url}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link icon icon_40 {{icon_class}} {{#if lightbox}}lightbox_link{{/if}}" title="Open in icon_class compare="thumb_40"}}					<img src="{{file.thumb_80}}" />				{{else}}					<img src="{{file.thumb_360}}" />				{{/if_equal}}			{{else}}				<span data-file-id="{{file.id}}" class="filetype_icon s24 {{file.filetype}}"></span>			{{/if}}		</a>		<span class="float-left" style="width: 85%">			<a href="{{file.permalink}}"{{#isClient}}target="{{file.permalink}}"{{/isClient}}  data-file-id="{{file.id}}" class="file_preview_link file_name">{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}</a>			{{#unless file.thumb_360}}				{{#unless file.is_external}}					<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file"><i class="fa fa-cloud-download file_inline_icon"></i></a>				{{/unless}}			{{/unless}}			{{#unless standalone}}				{{#if file.thumb_360_gif}}					{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}				{{else}}					{{{inlineImgToggler file.thumb_360 msg_dom_id}}}				{{/if}}			{{/unless}}			<br />			{{#if file.is_shared}}				in				{{{makeFileGroupChannelList file}}}			{{/if}}			<span class="bullet">閳?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>			{{#fileIsImage id=file.id}}				<span class="bullet">閳?/span>				<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>			{{/fileIsImage}}			</span>		<div class="clear-both"></div>	</div>	{{#unless standalone}}		{{#if file.thumb_360_gif}}			{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgDiv file.thumb_360 msg_dom_id}}}		{{/if}}	{{/unless}}	{{/isTheme}}	{{#isTheme theme="light"}}	<span class="meta">		<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}}data-file-id="{{file.id}}" class="file_preview_link file_name">			{{#if file.title}}{{file.title}}{{else}}{{file.name}}{{/if}}		</a>		{{#if file.is_external}}			<a href="{{#if file.is_external}}{{file.url}}{{else}}{{file.permalink}}{{/if}}" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on {{#if_equal file.external_type compare="gdrive"}}Google Drive{{/if_equal}}{{#if_equal file.external_type compare="dropbox"}}Dropbox{{/if_equal}}{{#if_equal file.external_type compare="box"}}Box{{/if_equal}}{{#if_equal file.external_type compare="unknown"}}a web page{{/if_equal}}"><i class="fa fa-external-link-square file_inline_icon"></i></a>		{{/if}}		{{#unless file.thumb_360}}			{{#unless file.is_external}}				<a href="{{file.url_private_download}}" target="{{newWindowName}}" data-toggle="tooltip" title="Download file"><i class="fa fa-cloud-download file_inline_icon"></i></a>			{{/unless}}		{{/unless}}	</span>	{{#unless standalone}}		{{#if file.thumb_360_gif}}			{{{inlineImgToggler file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgToggler file.thumb_360 msg_dom_id}}}		{{/if}}		{{#if file.thumb_360_gif}}			{{{inlineImgDiv file.thumb_360_gif msg_dom_id}}}		{{else}}			{{{inlineImgDiv file.thumb_360 msg_dom_id}}}		{{/if}}	{{/unless}}	<span class="meta block">		{{#if file.is_external}}			{{#if_equal file.external_type compare="gdrive"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Google Drive"><img src="/img/services/gdrive_16.png" class="gdrive_icon file_service_icon grayscale" /></a>			{{/if_equal}}			{{#if_equal file.external_type compare="dropbox"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Dropbox"><i class="fa fa-dropbox file_service_icon"></i></a>			{{/if_equal}}			{{#if_equal file.external_type compare="box"}}				<a href="{{file.url}}" class="no_underline" target="{{newWindowName}}" data-toggle="tooltip" title="Open file on Box"><img src="/plugins/box/assets/service_32.png" class="box_icon file_service_icon grayscale" /></a>			{{/if_equal}}		{{/if}}		{{#if uploader}}{{{makeMemberPreviewLinkById uploader.id false}}}{{possessive uploader.name}}{{else}}{{/if}} 		{{#if file.is_external}}			{{{external_filetype_html}}}		{{else}}			File		{{/if}}		{{#unless file.is_external}}			<span class="bullet">閳?/span>			<a href="{{file.url_private_download}}" target="{{file.url_private_download}}" class="file_download_link" title="Download this file">{{convertFilesize file.size}} <span>{{file.pretty_type}}</span></a>		{{/unless}}		{{#if file.is_shared}}			<span class="bullet">閳?/span>			in {{{makeFileGroupChannelList file}}}		{{/if}}		{{#unless standalone}}			<span class="bullet">閳?/span>			<a href="{{file.permalink}}" {{#isClient}}target="{{file.permalink}}"{{/isClient}} data-file-id="{{file.id}}" class="file_preview_link file_comment_link">				{{#if file.comments_count}}{{pluralCount file.comments_count "comment" "comments"}}{{else}}Add comment{{/if}}			</a>		{{/unless}}		{{#fileIsImage id=file.id}}			<span class="bullet">閳?/span>			<a href="{{file.url_private}}" target="{{file.url_private}}" data-file-id="{{file.id}}">Open original</a>		{{/fileIsImage}}	</span>	{{/isTheme}}</div>', 
    	messages_search_paging_template: '<div class="search_paging">{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left fa fa-chevron-circle-left disabled"></i>{{else}}<a onclick="CM.search.view.pageMessagesBack()"><i class="left fa fa-chevron-circle-left"></i></a>{{/if_equal}}{{/if_not_equal}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right fa fa-chevron-circle-right disabled"></i>{{else}}<a onclick="CM.search.view.pageMessagesForward()"><i class="right fa fa-chevron-circle-right"></i></a>{{/if_equal}}{{/if_not_equal}}</div>', 
    	files_search_paging_template: '<div class="search_paging">{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=1}}<i class="left fa fa-chevron-circle-left disabled"></i>{{else}}<a onclick="CM.search.view.pageFilesBack()"><i class="left fa fa-chevron-circle-left"></i></a>{{/if_equal}}{{/if_not_equal}}<span class="page_text">page {{current_page}} of {{pages}}</span>{{#if_not_equal pages compare=1}}{{#if_equal current_page compare=pages}}<i class="right fa fa-chevron-circle-right disabled"></i>{{else}}<a onclick="CM.search.view.pageFilesForward()"><i class="right fa fa-chevron-circle-right"></i></a>{{/if_equal}}{{/if_not_equal}}</div>', 
    	compile: function(b) {
    	    var e = b + "_template";
    	    if (CM.templates[e]) {
    	        return Handlebars.compile(CM.templates[e])
    	    }
    	    var a = "#" + e;
    	    var d = $(a).html();
    	    if (!d) {
    	    	CM.warn(a + " has no html");
    	        return null
    	    }
    	    var c = Handlebars.compile(d);
    	    return c
    	},
    	load:function(){var a=CM.utility.date.getTimeStamp();
    		//CM.templates.message=CM.templates.compile("message");
	    	CM.templates.channel_list=CM.templates.compile("channel_list");
	    	CM.templates.group_list=CM.templates.compile("group_list");
	    	CM.templates.im_list=CM.templates.compile("im_list");
	    	
	    	CM.templates.group=CM.templates.compile("group");
	    	CM.templates.channel=CM.templates.compile("channel");
	    	//CM.templates.im=CM.templates.compile("im");
	    	CM.templates.member=CM.templates.compile("member");
	    	//CM.templates.channel_members_list=CM.templates.compile("channel_members_list");
	    	CM.templates.group_create=CM.templates.compile("group_create");
	    	CM.templates.channel_create_dialog=CM.templates.compile("channel_create_dialog");
	    	
	    	CM.templates.message=CM.templates.compile("message");
	    	
	    	CM.templates.list_browser_dialog=CM.templates.compile("list_browser_dialog");
	    	CM.templates.list_browser_items=CM.templates.compile("list_browser_items");
	    	CM.templates.list_browser_items_by_membership=CM.templates.compile("list_browser_items_by_membership");
	    	
	    	CM.templates.menu=CM.templates.compile("menu");
	    	CM.templates.emoji_menu=CM.templates.compile("emoji_menu");
	    	CM.templates.emoji_header=CM.templates.compile("emoji_header");
	    	CM.templates.menu_emoticons=CM.templates.compile("menu_emoticons");
	    	CM.templates.menu_member_header=CM.templates.compile("menu_member_header");
	    	CM.templates.menu_member_items=CM.templates.compile("menu_member_items");
	    	CM.templates.menu_member_footer=CM.templates.compile("menu_member_footer");
	    	CM.templates.menu_user_footer=CM.templates.compile("menu_user_footer");
	    	CM.templates.menu_members_header=CM.templates.compile("menu_members_header");
	    	CM.templates.menu_members_items=CM.templates.compile("menu_members_items");
	    	CM.templates.menu_members_footer=CM.templates.compile("menu_members_footer");
	    	CM.templates.menu_group_header=CM.templates.compile("menu_group_header");
	    	CM.templates.menu_group_items=CM.templates.compile("menu_group_items");
	    	CM.templates.menu_group_footer=CM.templates.compile("menu_group_footer");
	    	CM.templates.menu_channel_header=CM.templates.compile("menu_channel_header");
	    	CM.templates.menu_channel_items=CM.templates.compile("menu_channel_items");
	    	CM.templates.menu_channel_footer=CM.templates.compile("menu_channel_footer");
	    	CM.templates.menu_groups_header=CM.templates.compile("menu_groups_header");
	    	CM.templates.menu_groups_items=CM.templates.compile("menu_groups_items");
	    	CM.templates.menu_team_items=CM.templates.compile("menu_team_items");
	    	CM.templates.menu_user_items=CM.templates.compile("menu_user_items");

	    	CM.templates.messages_day_divider = CM.templates.compile("messages_day_divider");
	        CM.templates.messages_unread_divider = CM.templates.compile("messages_unread_divider");
//	        CM.templates.file_reference = CM.templates.compile("file_reference");
//	        CM.templates.file_snippet_reference = CM.templates.compile("file_snippet_reference");
//	        CM.templates.file_post_reference = CM.templates.compile("file_post_reference");
    	},
    	registerPartials:function(){
            Handlebars.registerPartial("channel",CM.templates.channel);
            Handlebars.registerPartial("group",CM.templates.group);
            Handlebars.registerPartial("im",CM.templates.im);
            //Handlebars.registerPartial("file_public_link",CM.templates.file_public_link);
    	},
    	makeUnreadMessagesDomId: function(a) {
    	    return CM.utility.makeSafeForDomId("activity_unread_messages_" + a.id)    	
    	},
    	makeChannelDomId: function(a) {
    	    return "channel_" + a.id
    	}, makeDayDividerDomId: function(a) {
    	    return CM.utility.makeSafeForDomId("day_divider_" + a)
    	}, makeGroupDomId: function(a) {
    	    return "group_" + a.id
    	}, 
    	
    	makeMemberDomId: function(a) {
    	    if (!a) {
    	        return
    	    }
    	    return CM.templates.makeMemberDomIdById(a.id)
    	}, makeMemberDomIdById: function(a) {
    	    if (!a) {
    	        return
    	    }
    	    return "member_" + a
    	}, 
    	makeMemberDomClass: function(j) {
	        var g = "";
	        if (!j) {
	            return g
	        }
	        if (!j.is_self && j.presence == "away") {
	            g += "away "
	        }
	        if (CM.model.active_im_id) {
	            var h = CM.ims.getImById(CM.model.active_im_id);
	            if (h.user == j.id) {
	                g += "active "
	            }
	        }
	        var f = CM.ims.getImByMemberId(j.id);
	        if (f) {
	            if (f.unread_cnt > 0 || f.unread_highlight_cnt > 0) {
	                g += "unread mention "
	            }
	        }
	        return g
	    },
    	makeChannelListDomId: function(a) {
    	    return "channel_" + a.id + "_member_list"
    	},
    	makeUnreadJustDomId: function(a) {
    	    return "unread_just_" + a.id
    	}, makeUnreadHighlightDomId: function(a) {
    	    if (!a) {
    	        return
    	    }
    	    return "unread_highlight_" + a.id
    	}, makeUnreadHighlightDomIdById: function(id) {
    	    if (!id) {
    	        return null
    	    }
    	    return "unread_highlight_" + id;
    	},
    	makeMsgDomId: function(a) {
    	    return CM.utility.makeSafeForDomId("msg_" + a)
    	}, makeMsgAttachmentTextExpanderDomId: function(b, a) {
    	    return CM.utility.makeSafeForDomId("msg_rest_text_expander_" + b + "_" + a)
    	}, makeMSRDomId: function(a) {
    	    return CM.utility.makeSafeForDomId("MSR_" + a.channel._id + "_" + a.ts)
    	}, 
    	makeMemberPresenceDomClass: function(id) {
    	    return "member_presence_" + id
    	}, makeMemberPresenceIcon: function(memeber) {
    		var domclass = CM.templates.makeMemberPresenceDomClass(memeber.id);
     	    var a = '<i class="fa fa-circle presence_icon"></i>';
     	    if (memeber.is_ultra_restricted) {
     	    	domclass += " ura";
     	        a = '<i class="fa fa-caret-up presence_icon"></i>'
     	    } else {
     	        if (memeber.is_restricted) {
     	        	domclass += " ra";
     	            a = '<i class="fa fa-stop presence_icon"></i>'
     	        }
     	    }
     	    var b = '<span class="presence ' + memeber.online_status + " " + domclass + '" title="' + memeber.online_status + '">' + a + "</span>";
     	    return b 
    	}, 
    	makeMemberPresenceIconById: function(id) {
    		return CM.templates.makeMemberPresenceIcon(CM.members.getMemberById(id));
    	},
    	makeMemberStatusDomClass: function(a) {
    	    return "member_status_" + a
    	},
    	helpers:{
        	onStart: function() {
        		CM.templates.helpers.register()
        	}, 
        	register: function() {
        	    
        	    Handlebars.registerHelper("comments", CM.templates.builders.buildComments);
        	    Handlebars.registerHelper("formatTopicOrPurpose", function(f) {
        	        return CM.utility.formatTopicOrPurpose(f)
        	    });
        	    
        	    Handlebars.registerHelper("canUserCreateChannels", function(f) {
        	        return true ? f.fn(this) : f.inverse(this);//CM.members.canUserCreateChannels()
        	    });
        	   
        	    Handlebars.registerHelper("fileActionsLink", function(f) {
        	        return '<a class="file_actions file_actions_link" data-file-id="' + f.id + '">Actions <i class="fa fa-caret-down"></i></a>'
        	    });
        	    Handlebars.registerHelper("makeChannelDomId", function(f) {
        	        return CM.templates.makeChannelDomId(f)
        	    });
        	    Handlebars.registerHelper("makeChannelDomClass", function(g) {
        	        var f = "";
        	        if (CM.model.active_channel_id == g.id) {
        	            f += "active "
        	        }
        	        /*if (g.unread_cnt > 0) {
        	            f += "unread "
        	        }
        	        if (g.unread_highlight_cnt > 0) {
        	            f += "mention "
        	        }
        	        if (CM.utility.msgs.isChannelOrGroupMuted(g.id)) {
        	            f += "muted_channel "
        	        }*/
        	        return f
        	    });
        	    Handlebars.registerHelper("makeGroupDomId", function(f) {
        	        return CM.templates.makeGroupDomId(f)
        	    });
        	    Handlebars.registerHelper("makeGroupDomClass", function(g) {
        	        var f = "";
        	        if (CM.model.active_group_id == g.id) {
        	            f += "active "
        	        }
        	        if (g.unread_cnt > 0) {
        	            f += "unread "
        	        }
        	        if (g.unread_highlight_cnt > 0) {
        	            f += "mention "
        	        }
        	        if (g.is_starred) {
        	            f += "starred "
        	        }
//        	        if (CM.utility.msgs.isChannelOrGroupMuted(g._id)) {
//        	            f += "muted_channel "
//        	        }
        	        return f;
        	    });
        	    Handlebars.registerHelper("makeUnreadJustDomId", function(f) {
        	        return CM.templates.makeUnreadJustDomId(f)
        	    });
        	    Handlebars.registerHelper("makeChannelLink", CM.templates.builders.makeChannelLink);
        	    Handlebars.registerHelper("makeChannelLinkById", function(g) {
        	        var f = CM.channels.getChannelById(g);
        	        if (f) {
        	            return CM.templates.builders.makeChannelLink(f)
        	        }
        	    });
        	    Handlebars.registerHelper("makeUnreadHighlightDomId", function(f) {
        	        return CM.templates.makeUnreadHighlightDomId(f)
        	    });
        	    Handlebars.registerHelper("makeUnreadHighlightDomIdById", function(f) {
        	        return CM.templates.makeUnreadHighlightDomIdById(f)
        	    });
        	    Handlebars.registerHelper("makeMemberDomIdById", function(f) {
        	        return CM.templates.makeMemberDomIdById(f)
        	    });
        	    Handlebars.registerHelper("makeMemberDomId", function(f) {
        	        return CM.templates.makeMemberDomId(f)
        	    });
        	    
        	    Handlebars.registerHelper("makeMemberDomClass", function(member) {
        	        
        	        return CM.templates.makeMemberDomClass(member);
        	    });
        	    Handlebars.registerHelper("makeMemberDomClassById", function(id) {
        	        
        	        return CM.templates.makeMemberDomClass(CM.members.getMemberById(id));
        	    });
        	    Handlebars.registerHelper("makeMemberListDomClass", function(g) {
        	        var f = "member ";
        	        if (g.presence == "away") {
        	            f += "away "
        	        }
        	        return f
        	    });
        	    Handlebars.registerHelper("makeMemberPresenceIcon", function(member) {
        	        
        	        return CM.templates.makeMemberPresenceIcon(member);
        	    });
        	    Handlebars.registerHelper("makeMemberPresenceIconById", function(id) {
        	        
        	        return CM.templates.makeMemberPresenceIconById(id);
        	    });
        	    function getMemberColorClass(g) {
        	        var f = CM.members.getMemberById(g);
        	        if (!f) {
        	            return "color_unknown"
        	        }
        	        return "color_" + f._id
        	    }
                Handlebars.registerHelper("makeMemberPreviewLink", CM.templates.builders.makeMemberPreviewLink);
                Handlebars.registerHelper("makeMemberPreviewLinkById", function(h, f) {
                    if (f !== true) {
                        f = false
                    }
                    var g = CM.members.getMemberById(h);
                    if (!g) {
                        return h
                    }
                    return CM.templates.builders.makeMemberPreviewLink(g, f)
                });
                Handlebars.registerHelper("makeMemberPreviewLinkImage", function(f, o, g) {
                    var h = CM.members.getMemberById(f);
                    if (!h ) {
                        return ""
                    }
                    var n="thumb_36";
                    var m = "";
                    //m += "url('/assets/img/avatar_overlays.png'), "
                    var l="";	
                    if( h.avatar_thumb_file_id )
                    	l = "background-image:url('/upload/"+(h.avatar_thumb_file_id)+"')";
                    else
                    	l = "background-image:url('/assets/img/avatar_general_48.png')"
                    //m += "url('" + l + "');";
                    m += l;
                    var k = (CM.client) ? 'target="/team/' + h.name + '"' : "";
                    var j = '<a href="/team/' + h.name + '" ' + k + ' class="member_preview_link member_image ' + n + '" data-member-id="' + h.id + '" style="' + m + '"></a>'
            
                    return j
                });
//                Handlebars.registerHelper("emojiGraphicReplace", function(f) {
//                    return CM.utility.emojiGraphicReplace(f)
//                });
                Handlebars.registerHelper("makeMemberImage", CM.templates.builders.makeMemberImage);
                Handlebars.registerHelper("makeUsernameImage", function(j, s) {
                    var h = j.username;
                    var n, g, m, f;
                    var k;
                    var p = (j.bot_id) ? CM.boCM.getBotById(j.bot_id) : null;
                    if (j.icons) {
                        k = j.icons
                    } else {
                        if (p && p.icons) {
                            k = p.icons
                        } else {}
                    } if (k) {
                        if (k.image_36 && !CM.utility.is_retina) {
                            n = k.image_36
                        } else {
                            if (k.image_72 && CM.utility.is_retina) {
                                n = k.image_72
                            } else {
                                if (k.image_48) {
                                    n = k.image_48
                                } else {
                                    if (k.emoji && k.emoji.substr(0, 1) == ":" && k.emoji.substr(k.emoji.length - 1, 1) == ":") {
                                        m = k.emoji
                                    }
                                }
                            }
                        }
                    }
                    var q = "";
                    var r = "";
                    if (p && !p.deleted) {
                        q = '<a target="/services/' + p.id + '" href="/services/' + p.id + '">';
                        r = "</a>"
                    }
                    var o = (j && j.is_ephemeral && j.username == "slackbot") ? CM.members.getMemberById("USLACKBOT") : null;
                    switch (s) {
                        case 24:
                            g = "thumb_24";
                            f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-24.png?ssl=1";
                            if (o) {
                                f = o.profile.image_24
                            }
                            break;
                        case 32:
                            g = "thumb_32";
                            f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-32.png?ssl=1";
                            if (o) {
                                f = o.profile.image_32
                            }
                            break;
                        case 36:
                            g = "thumb_36";
                            f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-48.png?ssl=1";
                            if (o) {
                                f = o.profile.image_48
                            }
                            break;
                        case 72:
                            g = "thumb_72";
                            f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-72.png?ssl=1";
                            if (o) {
                                f = o.profile.image_72
                            }
                            break;
                        case 192:
                            g = "thumb_192";
                            f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-192.png?ssl=1";
                            if (o) {
                                f = o.profile.image_192
                            }
                            break;
                        default:
                            g = "thumb_48";
                            f = "https://i0.wp.com/slack-assets2.s3-us-west-2.amazonaws.com/8390/img/avatars/ava_0002-48.png?ssl=1";
                            if (o) {
                                f = o.profile.image_48
                            }
                            break
                    }
                    var l;
                    if (n) {
                        l = q + '<img style="border: 0" src="' + n + '" class="member_image ' + g + '" />' + r
                    } else {
                        if (m) {
                            l = q + '<div style="border: 0" class="member_image ' + g + '">' + CM.utility.emojiGraphicReplace(CM.utility.htmlEntities(m), true, false, true) + "</div>" + r
                        } else {
                            if (o) {
                                l = q + '<img src="' + f + '" class="member_image ' + g + '" />' + r
                            } else {
                                l = q + '<img src="' + f + '" class="member_image bot_icon_default ' + g + '" />' + r
                            }
                        }
                    }
                    return l
                });
        	    Handlebars.registerHelper("getMemberColorClassById", getMemberColorClass);
        	    Handlebars.registerHelper("getMemberColorClassByImId", function(id) {
        	        var im = CM.ims.getImById(id);
        	        if (!im) {
        	            return "color_unknown"
        	        }
        	        return getMemberColorClass(im.user)
        	    });
        	    Handlebars.registerHelper("getDisplayNameOfUserForIm", function(f) {
        	        if (!f) {
        	            return "MISSING_IM"
        	        }
        	        return CM.ims.getDisplayNameOfUserForIm(f)
        	    });
        	    Handlebars.registerHelper("msgIsFromSelf", function(f) {
        	        var g = f.hash.msg;
        	        var j = g.user;
        	        if (!j && g.subtype == "file_comment" && g.comment) {
        	            j = g.comment.user
        	        }
        	        var h = CM.members.getMemberById(j);
        	        if (!h) {
        	            return f.inverse(this)
        	        }
        	        if (h.is_self) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("memberIsSelf", function(f) {
        	        var g = CM.members.getMemberById(f.hash.id);
        	        if (!g) {
        	            return f.inverse(this)
        	        }
        	        if (g.is_self) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("memberIsAdmin", function(f) {
        	        var g = CM.members.getMemberById(f.hash.id);
        	        if (!g) {
        	            return f.inverse(this)
        	        }
        	        if (g.is_admin) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("currentUserIsAdmin", function(f) {
        	        if (CM.model.user.is_admin) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });
        	    Handlebars.registerHelper("ellipsize", function(g, f) {
        	        CM.info("len" + f);
        	        return CM.utility.ellipsize(g, f)
        	    });
        	    Handlebars.registerHelper("stripWhitespace", function(f) {
        	        return f.replace(/\s+/g, "")
        	    });
        	    Handlebars.registerHelper("pluralize", function(h, g, f) {
        	        var h = parseInt(h);
        	        if (h === 1) {
        	            return g
        	        } else {
        	            return (typeof f === "string" ? f : g + "s")
        	        }
        	    });
        	    Handlebars.registerHelper("pluralCount", function(h, g, f) {
        	        return h + " " + Handlebars.helpers.pluralize.apply(this, arguments)
        	    });
        	    Handlebars.registerHelper("possessive", function(f) {
        	        if (f.substr(-1, f.length) == "s") {
        	            return "'"
        	        } else {
        	            return "'s"
        	        }
        	    });
        	    Handlebars.registerHelper("toHour", function(f) {
        	        return CM.utility.date.toHour(f)
        	    });
        	    Handlebars.registerHelper("timezoneLabel", function(g, f) {
        	        return CM.utility.date.timezoneLabel(g, f)
        	    });
        	    Handlebars.registerHelper("if_equal", function(g, f) {
        	        if (g == f.hash.compare) {
        	            return f.fn(this)
        	        }
        	        return f.inverse(this)
        	    });
        	    Handlebars.registerHelper("if_not_equal", function(g, f) {
        	        if (g != f.hash.compare) {
        	            return f.fn(this)
        	        }
        	        return f.inverse(this)
        	    });
        	    Handlebars.registerHelper("if_gt", function(g, f) {
        	        if (g > f.hash.compare) {
        	            return f.fn(this)
        	        }
        	        return f.inverse(this)
        	    });
        	    Handlebars.registerHelper("foreach", function(f, g) {
        	        if (g.inverse && !f.length) {
        	            return g.inverse(this)
        	        }
        	        return f.map(function(j, h) {
        	            var k = {
        	                index: h,
        	                value: j,
        	                length: f.length
        	            };
        	            k.first = h === 0;
        	            k.last = h === f.length - 1;
        	            return g.fn(k)
        	        }).join("")
        	    });
        	    Handlebars.registerHelper("numberWithMax", function(g, f) {
        	        if (g >= f) {
        	            return (f - 1) + "+"
        	        } else {
        	            return g
        	        }
        	    });
        	   
        	    Handlebars.registerHelper("toDate", function(f) {
        	        return CM.utility.date.toDate(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDate", function(f) {
        	        return CM.utility.date.toCalendarDate(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDateShort", function(f) {
        	        return CM.utility.date.toCalendarDate(f, true)
        	    });
        	    Handlebars.registerHelper("toCalendarDateOrNamedDay", function(f) {
        	        return CM.utility.date.toCalendarDateOrNamedDay(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDateIfYesterdayOrTomorrow", function(f) {
        	        return CM.utility.date.toCalendarDateIfYesterdayOrTomorrow(f)
        	    });
        	    Handlebars.registerHelper("toCalendarDateOrNamedDayShort", function(f) {
        	        return CM.utility.date.toCalendarDateOrNamedDayShort(f)
        	    });
        	    Handlebars.registerHelper("toTime", function(g, f, h) {
        	        return CM.utility.date.toTime(g, f !== false, h === true)
        	    });
        	    Handlebars.registerHelper("msgTsTitle", function(g) {
        	        var f = (CM.utility.date.toCalendarDateOrNamedDayShort(g.ts) + " at " + CM.utility.date.toTime(g.ts, true, true)).replace(/\s/g, "&nbsp;");
//        	        if (CM.client) {
//        	            f += "&#013;Click to open in archives"
//        	        }
        	        return f
        	    });
        	    Handlebars.registerHelper("toHour", function(f) {
        	        return CM.utility.date.toHour(f)
        	    });
        	    Handlebars.registerHelper("timezoneLabel", function(g, f) {
        	        return CM.utility.date.timezoneLabel(g, f)
        	    });

                Handlebars.registerHelper("unFormatMessage", function(g, f) {
                    return g;
                	//return CM.format.unFormatMsg(g, f)
                });
                Handlebars.registerHelper("formatMessageResult", function(f) {
                	
                    //f = CM.format.formatMsg(f);
                	//f = CM.utility.msgs.handleSearchHighlights(f);
                    return f
                });
                Handlebars.registerHelper("makeMsgDomId", CM.templates.makeMsgDomId);
                Handlebars.registerHelper("makeMSRDomId", CM.templates.makeMSRDomId);
                Handlebars.registerHelper("makeMsgDomClass", function(g) {
                    var f = "";
                    if (!g.subtype) {} else {
                        if (g.subtype == "channel_join" || g.subtype == "group_join") {
                            f += "joined"
                        } else {
                            if (g.subtype == "channel_leave" || g.subtype == "group_leave") {
                                f += "left"
                            } else {
                                if (g.subtype == "channel_topic" || g.subtype == "group_topic") {
                                    f += "topic"
                                } else {
                                    if (g.subtype == "channel_name" || g.subtype == "group_name") {
                                        f += "rename"
                                    } else {
                                        if (g.subtype == "channel_purpose" || g.subtype == "group_purpose") {
                                            f += "purpose"
                                        } else {
                                            if (g.subtype == "channel_archive" || g.subtype == "group_archive") {
                                                f += "archived"
                                            } else {
                                                if (g.subtype == "channel_unarchive" || g.subtype == "group_unarchive") {
                                                    f += "unarchived"
                                                } else {
                                                    if (g.subtype == "bot_message") {
                                                        f += "bot_message"
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    return f
                });
//                Handlebars.registerHelper("formatMessageByType", CM.templates.builders.formatMessageByType);
//                Handlebars.registerHelper("formatAttachments", CM.templates.builders.formatAttachments);
                Handlebars.registerHelper("formatMessage", function(g, f) {
                    return CM.format.formatMsg(g, f)
                });
                Handlebars.registerHelper("formatMessageSimple", function(g, f) {
                    return CM.format.formatMsg(g, f, false, false, false, false, true, true)
                });
                Handlebars.registerHelper("formatMessageVerySimple", function(g, f) {                	
                    return g.body;
                });
//                Handlebars.registerHelper("formatMessageAttachmentPart", function(k, j, f, h, g) {
//                    return CM.format.formatMsg(k, j, false, false, false, false, !(f === true), !(h === true), null, !(g === true))
//                });
//                Handlebars.registerHelper("formatTopicOrPurpose", function(f) {
//                    return CM.utility.formatTopicOrPurpose(f)
//                });
                Handlebars.registerHelper("unFormatMessage", function(g, f) {
                    return CM.format.unFormatMsg(g, f)
                });
//                Handlebars.registerHelper("formatMessageResult", function(f) {
//                    f = CM.format.formatMsg(f);
//                    f = CM.utility.msgs.handleSearchHighlights(f);
//                    return f
//                });
                Handlebars.registerHelper("makeDayDividerDomId", function(f) {
                    return CM.templates.makeDayDividerDomId(f)
                });
        	    Handlebars.registerHelper("getMemberNameById", function(g) {
        	        var f = CM.members.getMemberById(g);
        	        return f ? f.name : g
        	    });
        	    Handlebars.registerHelper("getMemberDisplayNameById", function(g) {
        	        var f = CM.members.getMemberById(g);
        	        return f ? CM.members.getMemberDisplayName(f) : g
        	    });
        	    Handlebars.registerHelper("getMemberDisplayName", function(f) {
        	        return CM.members.getMemberDisplayName(f)
        	    });
        	    Handlebars.registerHelper("getDisplayNameOfUserForIm", function(f) {
        	        if (!f) {
        	            return "MISSING_IM"
        	        }
        	        return CM.ims.getDisplayNameOfUserForIm(f)
        	    });
        	    Handlebars.registerHelper("getIMNameById", function(g) {
        	        var f = CM.ims.getImById(g);
        	        return f ? f.name : g
        	    });
        	    Handlebars.registerHelper("getIMIdByMemberId", function(g) {
        	        var f = CM.ims.getImByMemberId(g);
        	        return f ? f._id : ""
        	    });
        	    Handlebars.registerHelper("memberHasIm", function(f) {
        	        var h = f.hash.member;
        	        var g = false;
        	        if (h) {
        	            if (CM.ims.getImByMemberId(h._id)) {
        	                g = true
        	            }
        	        }
        	        if (g) {
        	            return f.fn(this)
        	        } else {
        	            return f.inverse(this)
        	        }
        	    });

        	    function b(f) {
        	        var j = CM.members.getMemberById(f.user);
        	        var h = "color_" + ((j) ? j._id : "unknown");
        	        var g = (CM.client) ? 'target="/messages/@' + f.name + '"' : "";
        	        return '<a href="/messages/@' + f.name + '" ' + g + '" class="internal_im_link ' + h + '" data-member-name="' + f.name + '">@' + f.name + "</a>"
        	    }
        	    Handlebars.registerHelper("makeIMLink", b);
        	    Handlebars.registerHelper("makeIMLinkById", function(g) {
        	        var f = CM.ims.getImById(g);
        	        if (f) {
        	            return b(f)
        	        }
        	    });

        	}
    	},
      builders:{
        onStart:function(){},  
        newWindowName: function(a) {
            //if web
            return "_self"
        },
        formatMessageByType: function(g, f, a) {
            var b = "";
            if (g.ignore_if_attachments_supported) {
                return b
            }
            f = (f === true);
            a = (a === true);
            if (g.subtype == "channel_join") {
                var d = CM.channels.getChannelById(CM.model.active_channel_id);
                var c = CM.members.getMemberById(g.inviter);
                if (c) {
                    b = CM.format.formatMsg("joined" + (d ? " #" + d.name : " the channel") + " from an invitation by <@" + c.id + "|" + c.name + ">", g, false, false, false, false, true, true)
                } else {
                    b = "joined" + (d ? " #" + d.name : " the channel")
                }
            } else {
                if (g.subtype == "channel_leave") {
                    var d = CM.channels.getChannelById(CM.model.active_channel_id);
                    b = "left" + (d ? " #" + d.name : " the channel")
                } else {
                    if (g.subtype == "channel_name") {
                        var d = CM.channels.getChannelById(CM.model.active_channel_id);
                        b = 'renamed the channel from "' + g.old_name + '" to "' + g.name + '"'
                    } else {
                        if (g.subtype == "channel_topic") {
                            if (!g.topic) {
                                b = "cleared the channel topic"
                            } else {
                                b = 'set the channel topic: <span class="topic">' + CM.format.formatMsg(g.topic, g, false, false, false, false, true, true) + "</span>"
                            }
                        } else {
                            if (g.subtype == "channel_purpose") {
                                if (!g.purpose) {
                                    b = "cleared the channel purpose"
                                } else {
                                    b = 'set the channel purpose: <span class="purpose">' + CM.format.formatMsg(g.purpose, g, false, false, false, false, true, true) + "</span>"
                                }
                            } else {
                                if (g.subtype == "group_join") {
                                    var e = CM.groups.getGroupById(CM.model.active_group_id);
                                    var c = CM.members.getMemberById(g.inviter);
                                    if (c) {
                                        b = "joined" + (e ? " " + CM.model.group_prefix + e.name : " the group") + " " + CM.format.formatMsg("from an invitation by <@" + c.id + "|" + c.name + ">", g, false, false, false, false, true, true)
                                    } else {
                                        b = "joined" + (e ? " " + CM.model.group_prefix + e.name : " the group")
                                    }
                                } else {
                                    if (g.subtype == "group_leave") {
                                        var e = CM.groups.getGroupById(CM.model.active_group_id);
                                        b = "left" + (e ? " " + CM.model.group_prefix + e.name : " the group")
                                    } else {
                                        if (g.subtype == "group_name") {
                                            var d = CM.channels.getChannelById(CM.model.active_channel_id);
                                            b = 'renamed the group from "' + g.old_name + '" to "' + g.name + '"'
                                        } else {
                                            if (g.subtype == "group_topic") {
                                                if (!g.topic) {
                                                    b = "cleared the group topic"
                                                } else {
                                                    b = "set the group topic: " + CM.format.formatMsg(g.topic, g, false, false, false, false, true, true)
                                                }
                                            } else {
                                                if (g.subtype == "group_purpose") {
                                                    if (!g.purpose) {
                                                        b = "cleared the group purpose"
                                                    } else {
                                                        b = "set the group purpose: " + CM.format.formatMsg(g.purpose, g, false, false, false, false, true, true)
                                                    }
                                                } else {
                                                    if (g.subtype == "group_archive") {
                                                        var e = CM.groups.getGroupById(CM.model.active_group_id);
                                                        b = "archived" + (e ? " " + CM.model.group_prefix + e.name : " the group");
                                                        if (CM.client && e && e.is_archived) {
                                                            b += '. The contents will still be available in search and browsable in the <a target="_blank" href="/archives/' + e.name + '">archives</a>. 						It can also be un-archived at any time. To close it now, <a onclick="CM.groups.closeGroup(\'' + e.id + "')\">click here</a>."
                                                        }
                                                    } else {
                                                        if (g.subtype == "group_unarchive") {
                                                            var e = CM.groups.getGroupById(CM.model.active_group_id);
                                                            b = "un-archived" + (e ? " " + CM.model.group_prefix + e.name : " the group")
                                                        } else {
                                                            if (g.subtype == "channel_archive") {
                                                                var d = CM.channels.getChannelById(CM.model.active_channel_id);
                                                                b = "archived" + (d ? " #" + d.name : " the channel");
                                                                if (CM.client && d && d.is_archived) {
                                                                    b += '. The contents will still be available in search and browsable in the <a target="_blank" href="/archives/' + d.name + '">archives</a>. 						It can also be un-archived at any time. To close it now, <a onclick="CM.channels.closeArchivedChannel(\'' + d.id + "')\">click here</a>."
                                                                }
                                                            } else {
                                                                if (g.subtype == "channel_unarchive") {
                                                                    var d = CM.channels.getChannelById(CM.model.active_channel_id);
                                                                    b = "un-archived" + (d ? " #" + d.name : " the channel")
                                                                } else {
                                                                    if (g.subtype == "me_message") {
                                                                        b = "<i>" + CM.format.formatMsg(g.text, g, f) + "</i>"
                                                                    } else {
                                                                        if (g.subtype == "play_sound") {
                                                                            b = 'played "' + g.sound + '"'
                                                                        } else {
                                                                            b = CM.format.formatMsg(g.text, g, f, null, null, null, null, null, null, a)
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            } if (!b && b != "") {
                CM.warn("no html msg.subtype:" + g.subtype);
                return ""
            }
            b = CM.utility.msgs.handleSearchHighlights(b);
            return b
        },

        buildComments: function(d) {
            var g = {
                file: d
            };
            var f = d.comments;
            var c = "";
            var h = false;
            for (var b = 0; b < f.length; b++) {
                var a = f[b].user == CM.model.user.id;
                var e = a || CM.model.user.is_admin;
                if (a || e) {
                    h = true
                }
                c += CM.templates.comment({
                    comment: f[b],
                    file: d,
                    show_comment_actions: h
                })
            }
            return c
        },
        makeChannelLink: function(a) {
            if (!a) {
                return "ERROR: MISSING CHANNEL"
            }
            var b = (CM.client) ? 'target="/archives/' + a.name + '"' : "";
            return '<a href="/archives/' + a.name + '" ' + b + ' class="channel_link" data-channel-id="' + a.id + '"><span class="normal">#</span>' + a.name + "</a>"
        },
        makeGroupLink: function(b) {
            if (!b) {
                return "ERROR: MISSING GROUP"
            }
            var a = (CM.client) ? 'target="/archives/' + b.name + '"' : "";
            return '<a href="/archives/' + b.name + '" ' + a + '" class="group_link" data-group-id="' + b.id + '">' + CM.model.group_prefix + b.name + "</a>"
        },
        makeChannelLink: function(a) {
            if (!a) {
                return "ERROR: MISSING CHANNEL"
            }
            var b = (CM.client) ? 'target="/archives/' + a.name + '"' : "";
            return '<a href="/archives/' + a.name + '" ' + b + ' class="channel_link" data-channel-id="' + a.id + '"><span class="normal">#</span>' + a.name + "</a>"
        },
        makeGroupLink: function(b) {
            if (!b) {
                return "ERROR: MISSING GROUP"
            }
            var a = (CM.client) ? 'target="/archives/' + b.name + '"' : "";
            return '<a href="/archives/' + b.name + '" ' + a + '" class="group_link" data-group-id="' + b.id + '">' + CM.model.group_prefix + b.name + "</a>"
        },
        makeMemberPreviewLink: function(user, b) {
            if (!user) {
                return ""
            }
            if (b !== true) {
                b = false
            }
            var a = "color_" + ((user) ? user.id : "unknown");
            var d = (CM.client) ? 'target="/team/' + user.name + '"' : "";
            var c = '<a href="/team/' + user.name + '" ' + d + ' class="bold member member_preview_link ' + a + '" data-member-id="' + user.id + '">';
            if (b && user.id == CM.model.user.id) {
                c += "You"
            } else {
                c += CM.members.getMemberDisplayName(user, true)
            }
            c += "</a>";
            return c
        },
        makeMemberImage: function(g, e, d) {
            var f = CM.members.getMemberById(g);
            if (!f || !f.profile) {
                return ""
            }
            d = (d === true);
            var b, a;
            switch (e) {
                case 24:
                    b = f.profile.image_24;
                    a = "thumb_24";
                    break;
                case 32:
                    b = f.profile.image_32;
                    a = "thumb_32";
                    break;
                case 36:
                    b = f.profile.image_48;
                    a = "thumb_36";
                    break;
                case 48:
                    b = f.profile.image_48;
                    a = "thumb_48";
                    break;
                case 72:
                    b = f.profile.image_72;
                    a = "thumb_72";
                    break;
                case 192:
                    b = f.profile.image_192;
                    a = "thumb_192";
                    break;
                default:
                    b = f.profile.image_48;
                    a = "thumb_48";
                    break
            }
            if (d) {
                var c = '<img data-original="' + b + '" class="lazy member_image ' + a + ' member_preview_image" data-member-id="' + f.id + '" />'
            } else {
                var c = '<img src="' + b + '" class="member_image ' + a + ' member_preview_image" data-member-id="' + f.id + '" />'
            }
            return c
        },
        buildMsgHTML: function(F, e) {
            if (e) {
                //CM.dir(0, F)
            }
            try {
                var f = true;
                var msg = F.msg;
                if (false && msg.text) {
                    msg = CM.utility.clone(msg);
                    msg.text += " <slack-action://BSLACKBOT/help/files/D026MK7NF|testing>"
                }
                var model_ob = F.model_ob;
                var prev_msg = F.prev_msg;
                var highlight = !!F.highlight;
                var no_attachments = !!F.no_attachments;
                var standalone = !!F.standalone;
                var full_date = !!F.full_date;
                var jump_link = F.jump_link;
                var starred_items_list = !!F.starred_items_list;
                var sharp_container_id = (F.container_id) ? "#" + F.container_id : "";
                var enable_slack_action_links = !!F.enable_slack_action_links;
                var theme = F.theme;
                if (!theme) {
                    theme = CM.model.prefs.theme
                }
                var v = "";
                var sender = CM.members.getMemberById(msg.from_user_id);
                var n = true;
                var not_standalone = !standalone;
                var P = false;
                var z = false;
                var K = CM.utility.date.toDateObject(msg.ts);
                var h = false;
                var G = false;
                var d = !!(msg.rsp_id);
                var o = false;
                var D = msg.from_user_id;
                var j = msg.is_ephemeral;
//                if (!D && f) {
//                    D = CM.templates.builders.getBotIdentifier(msg)
//                }
//                var s;
//                if (prev_msg) {
//                    s = (prev_msg.subtype == "file_comment" && prev_msg.comment) ? prev_msg.comment.user : prev_msg.user;
//                    if (!s && f) {
//                        s = CM.templates.builders.getBotIdentifier(prev_msg)
//                    }
//                }
                if (!msg.no_display && !standalone) {
                    if (prev_msg) {
                        var A = CM.utility.date.toDateObject(prev_msg.ts);
                        if (model_ob.last_read <= prev_msg.ts) {
                            z = true;
                        }
                        if (msg.subtype && msg.subtype == "file_comment" && msg.comment) {
                            D = msg.comment.user;
                        }
                        not_standalone = true;
                        n = true
                        if (!d && !CM.utility.date.sameDay(K, A)) {
                            if (!$(sharp_container_id + ' div.day_divider[data-date="' + CM.utility.date.toCalendarDate(msg.ts) + '"]').length) {
                                try {
                                    v += CM.templates.messages_day_divider({
                                        ts: msg.ts
                                    })
                                } catch (M) {
                                    CM.logError(M, "Problem with CM.templates.messages_day_divider 1.1 msg.ts:" + (msg ? msg.ts : "no msg?"))
                                }
                            }
                            h = true;
                            var t = $(sharp_container_id + " div.day_divider");
                            if (t.length > 0) {
                                var r;
                                var b = $(t[t.length - 1]);
                                if (b.length) {
                                    r = "";
                                    try {
                                        r = CM.templates.messages_day_divider({
                                            ts: b.data("ts")
                                        })
                                    } catch (M) {
                                        CM.logError(M, "Problem with CM.templates.messages_day_divider 2.1 $last_divider.data('ts'):" + b.data("ts"))
                                    }
                                    b.replaceWith(r)
                                }
                                if (t.length > 1) {
                                    var L = $(t[t.length - 2]);
                                    if (L.length) {
                                        r = "";
                                        try {
                                            r = CM.templates.messages_day_divider({
                                                ts: L.data("ts")
                                            })
                                        } catch (M) {
                                            CM.logError(M, "Problem with CM.templates.messages_day_divider 3.1 $second_last_divider.data('ts'):" + L.data("ts"))
                                        }
                                        L.replaceWith(r)
                                    }
                                }
                            }
                        }
                        if (!d && CM.utility.date.distanceInMinutes(K, A) > CM.model.msg_activity_interval) {
                            G = true;
                            model_ob.last_time_divider = K
                        }
                    } else {
                        if (!$(sharp_container_id + ' div.day_divider[data-date="' + CM.utility.date.toCalendarDate(msg.ts) + '"]').length) {
                            try {
                                v += CM.templates.messages_day_divider({
                                    ts: msg.ts
                                })
                            } catch (M) {
                                CM.logError(M, "Problem with CM.templates.messages_day_divider 4.1 msg.ts:" + (msg ? msg.ts : "no msg?"))
                            }
                        }
                        G = true;
                        model_ob.last_time_divider = K
                    }
                }
                if (G) {
                    n = true;
                    P = true
                }
                if (msg.type != "message") {
                    n = true
                }
                if (msg.subtype == "bot_message") {
                    if (CM.templates.builders.getBotIdentifier(msg)) {
                        if (!f) {
                            n = true
                        }
                    } else {
                        n = false
                    }
                }
                if (msg.subtype == "me_message" || (prev_msg && prev_msg.subtype == "me_message")) {
                    n = true;
                    not_standalone = true
                }
                var O = true;
                if (standalone) {
                    O = false
                }
//                var B = CM.utility.msgs.getMsgActions(msg);
//                var a = false;
//                if (B.edit_msg || B.delete_msg) {
//                    a = true
//                }
                var m = {
                    msg: msg,
//                    actions: B,
//                    show_actions_cog: a,
                    member: sender,
                    show_user: n,
                    hide_user_name: o,
                    show_divider: not_standalone,
                    first_in_block: P,
                    unread: z,
                    unprocessed: d,
                    highlight: highlight,
                    model_ob: model_ob,
                    do_inline_imgs: O,
                    msg_dom_id: CM.templates.makeMsgDomId(msg.ts),
                    standalone: standalone,
                    full_date: full_date,
                    jump_link: jump_link,
                    show_resend_controls: msg.ts in CM.model.display_unsent_msgs,
                    starred_items_list: starred_items_list,
                    theme: theme,
                    no_attachments: no_attachments,
                    is_ephemeral: j,
                    enable_slack_action_links: enable_slack_action_links
                };
//                if (!CM.utility.msgs.isTempMsg(msg)) {
//                    m.permalink = CM.utility.msgs.constructMsgPermalink(model_ob, msg.ts)
//                }
                if (msg.subtype == "file_share" || msg.subtype == "file_mention") {
                    if (!msg.file) {} else {
                        m.file = msg.file;
                        m.is_mention = (msg.subtype == "file_mention");
                        m.lightbox = false;
                        if (msg.file.thumb_360_w == 360 || msg.file.thumb_360_h == 360) {
                            m.lightbox = true
                        }
                        if (msg.subtype == "file_share" && msg.upload) {
                            m.show_initial_comment = true;
                            if (msg.file.mode == "snippet") {
                                v += CM.templates.message_file_snippet_create(m)
                            } else {
                                m.icon_class = CM.utility.getImageIconClass(msg.file, "thumb_80");
                                try {
                                    v += CM.templates.message_file_upload(m)
                                } catch (M) {
                                    var Q = msg.ts;
                                    try {
                                        var k = CM.utility.clone(msg);
                                        delete k.text;
                                        Q += " " + JSON.stringify(k, null, "\t")
                                    } catch (M) {}
                                    CM.logError(M, "Problem with CM.templates.message_file_upload msg:" + Q);
                                    v += '<p class="small_top_margin small_bottom_margin"><code>Error rendering file_share msg</code></p>'
                                }
                            }
                        } else {
                            if (msg.file.user != msg.user) {
                                var J = CM.members.getMemberById(msg.file.user);
                                m.uploader = J
                            }
                            if (msg.file.mode == "snippet") {
                                v += CM.templates.message_file_snippet_share(m)
                            } else {
                                if (msg.file.mode == "post") {
                                    v += CM.templates.message_file_post_share(m)
                                } else {
                                    m.icon_class = CM.utility.getImageIconClass(msg.file, "thumb_40");
                                    if (msg.file.is_external) {
                                        m.external_filetype_html = CM.templates.builders.makeExternalFiletypeHTML(msg.file)
                                    }
                                    v += CM.templates.message_file_share(m)
                                }
                            }
                        }
                    }
                } else {
                    if (msg.subtype == "file_comment") {
                        if (prev_msg && !prev_msg.no_display && prev_msg.file && msg.file && msg.file.id == prev_msg.file.id) {
                            m.show_divider = false;
                            if (!h) {
                                m.is_file_convo_continuation = true
                            }
                        }
                        m.show_comment_quote_icon = true;
                        if (prev_msg && !prev_msg.no_display && prev_msg.file && msg.file && msg.file.id == prev_msg.file.id) {
                            if (prev_msg.subtype == "file_share" && prev_msg.upload && prev_msg.file.initial_comment) {
                                if (!h) {
                                    m.show_comment_quote_icon = false
                                }
                            }
                            if (prev_msg.subtype == "file_comment") {
                                if (!h) {
                                    m.show_comment_quote_icon = false
                                }
                            }
                        }
                        m.file = msg.file;
                        m.icon_class = CM.utility.getImageIconClass(msg.file, "thumb_40");
                        m.comment = msg.comment;
                        sender = (msg.comment) ? CM.members.getMemberById(msg.comment.user) : null;
                        m.member = sender;
                        if (msg.file && msg.file.user != msg.comment.user) {
                            var J = CM.members.getMemberById(msg.file.user);
                            m.uploader = J
                        }
                        if (msg.file && msg.file.mode == "post") {
                            v += CM.templates.message_file_post_comment(m)
                        } else {
                            v += CM.templates.message_file_comment(m)
                        }
                    } else {
                        v += CM.templates.message(m)
                    }
                }
                v = v.replace(/\ue000/g, "").replace(/\ue001/g, "");
                return v
            } catch (M) {
                var Q = "";
                if (msg) {
                    Q = "msg.ts:" + msg.ts;
                    delete F.model_ob;
                    try {
                        F.msg = CM.utility.clone(msg);
                        delete F.msg.body;
                        Q += " " + JSON.stringify(F, null, "\t")
                    } catch (M) {}
                }
                CM.logError(M, "Problem in buildMsgHTML with_args " + Q);
                return ""
            }
        },
      },	
	
}