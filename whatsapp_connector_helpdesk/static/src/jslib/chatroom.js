odoo.define('@48309a956b3c89d5cd9cc0ecd71a7ee64518ef6f77ffc4b8cc6a8b36754a340a',['@web/core/utils/patch','@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const HelpdeskForm=__exports.HelpdeskForm=class HelpdeskForm extends ChatroomActionTab{setup(){super.setup()
this.env;this.props}
getExtraContext(props){const context=Object.assign(super.getExtraContext(props),{default_partner_id:props.selectedConversation.partner.id,})
return context}
async onSave(record){await super.onSave(record)
if(record.resId!==this.props.selectedConversation.ticket.id){await this.env.services.orm.write(this.env.chatModel,[this.props.selectedConversation.id],{ticket_id:record.resId},{context:this.env.context})
this.props.selectedConversation.updateFromJson({ticket_id:[record.resId,record.data.name]})
this.env.chatBus.trigger('updateConversation',this.props.selectedConversation)}}
_getOnSearchChatroomDomain(){let domain=super._getOnSearchChatroomDomain()
domain.push(['conversation_id','=',this.props.selectedConversation.id])
if(this.props.selectedConversation.partner.id){domain.unshift('|')
domain.push(['partner_id','=',this.props.selectedConversation.partner.id])}
return domain}}
HelpdeskForm.props=Object.assign({},HelpdeskForm.props)
HelpdeskForm.defaultProps=Object.assign({},HelpdeskForm.defaultProps)
patch(HelpdeskForm.props,{selectedConversation:{type:ConversationModel.prototype},viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},})
patch(HelpdeskForm.defaultProps,{viewModel:'helpdesk.ticket',viewType:'form',viewKey:'helpdesk_form',})
return __exports;});;
odoo.define('@318a06a2407d7b1e77a92a5516e93c3368d8dd6a39761b36ed74dc1e0349f886',['@web/core/utils/patch','@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{Chatroom}=require('@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6')
const chatroomHelpdesk={setup(){super.setup()
this.helpdeskAllowed=false},getSubEnv(){const out=super.getSubEnv()
out.helpdeskAllowed=()=>this.helpdeskAllowed
return out},async willStart(){await super.willStart()
this.helpdeskAllowed=await this.env.services.user.hasGroup('helpdesk.group_helpdesk_user')},}
patch(Chatroom.prototype,chatroomHelpdesk)
return __exports;});;
odoo.define('@7657be9e1f32f718083eb8169ebe3189ed40efb84654ae225903358334083b8d',['@web/core/utils/patch','@web/core/l10n/translation','@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b','@48309a956b3c89d5cd9cc0ecd71a7ee64518ef6f77ffc4b8cc6a8b36754a340a'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{_t}=require('@web/core/l10n/translation')
const{TabsContainer}=require('@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b')
const{HelpdeskForm}=require('@48309a956b3c89d5cd9cc0ecd71a7ee64518ef6f77ffc4b8cc6a8b36754a340a')
const chatroomHelpdeskTab={get tabHelpdeskFormProps(){return{viewTitle:_t('Helpdesk'),viewResId:this.props?.selectedConversation?.ticket?.id,selectedConversation:this.props?.selectedConversation,searchButton:true,}},get titles(){const out=super.titles
out.tab_helpdesk=_t('Helpdesk')
return out}}
patch(TabsContainer.prototype,chatroomHelpdeskTab)
patch(TabsContainer.components,{HelpdeskForm,})
return __exports;});;
odoo.define('@a0bd4f56eeb58be4d99ed6cd580ca54a4abdfa33495bd2fd379084ba9c8879f7',['@web/core/utils/patch','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const chatroomHelpdesk={constructor(comp,base){super.constructor(comp,base)
this.ticket={id:false,name:''}},updateFromJson(base){super.updateFromJson(base)
if('ticket_id'in base){this.ticket=this.convertRecordField(base.ticket_id)}}}
patch(ConversationModel.prototype,chatroomHelpdesk)
return __exports;});;
