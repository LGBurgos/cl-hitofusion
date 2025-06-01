odoo.define('@ff901afc2e3d24f68bdb4d2da86acd8e755824b10a5ed768565703bedd88ac9b',['@mail/core/common/attachment_model'],function(require){'use strict';let __exports={};const{Attachment:AttachmentBase}=require('@mail/core/common/attachment_model')
const Attachment=__exports.Attachment=class Attachment extends AttachmentBase{message=undefined
get isDeletable(){return!this.message}
get originThread(){return undefined}}
__exports[Symbol.for("default")]=Attachment
return __exports;});;
odoo.define('@ab7f5d9fd40e8af1794e1d4bda549e185b1adb30d52d425aee7a2d5297dae8ac',['@mail/core/common/attachment_list'],function(require){'use strict';let __exports={};const{AttachmentList:AttachmentListBase}=require('@mail/core/common/attachment_list')
const AttachmentList=__exports.AttachmentList=class AttachmentList extends AttachmentListBase{onClickUnlink(attachment){let out
if(attachment&&attachment.isAcrux){out=this.props.unlinkAttachment(attachment)}else{out=super.onClickUnlink(attachment)}
return out}}
__exports[Symbol.for("default")]=AttachmentList
return __exports;});;
odoo.define('@acbad003049675bb72f8aa048c5505a3b1ff288c3fd1edf91e41bc101c8deb3e',['@web/core/notebook/notebook'],function(require){'use strict';let __exports={};const{Notebook}=require('@web/core/notebook/notebook')
const NotebookChat=__exports.NotebookChat=class NotebookChat extends Notebook{}
NotebookChat.template='chatroom.Notebook'
return __exports;});;
odoo.define('@40e64ef7ac070ef0af43eab05c6e933b32a5eaff28ed053cf8a71586397c5e7f',['@web/core/utils/patch','@web/webclient/actions/action_container'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ActionContainer}=require('@web/webclient/actions/action_container')
const chatroomActions={setup(){super.setup()
this.env.bus.removeEventListener('ACTION_MANAGER:UPDATE',this.onActionManagerUpdate)
const superOnActionManagerUpdate=this.onActionManagerUpdate
this.onActionManagerUpdate=({detail:info})=>{if(info?.componentProps?.chatroomTab){}else{superOnActionManagerUpdate({detail:info})}}
this.env.bus.addEventListener('ACTION_MANAGER:UPDATE',this.onActionManagerUpdate)},}
patch(ActionContainer.prototype,chatroomActions)
return __exports;});;
odoo.define('@60b8dc7a17a2de3a353240a2ffbcd3eb19bf413fa80b9c484060a290dd4d8406',['@web/core/utils/patch','@web/webclient/actions/action_dialog','@odoo/owl'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ActionDialog}=require('@web/webclient/actions/action_dialog')
const{onWillDestroy,useEffect}=require('@odoo/owl')
const chatroomDialogHack={setup(){super.setup()
this.env.bus.trigger('last-dialog',this)
onWillDestroy(()=>this.env.bus.trigger('last-dialog',null))
useEffect(()=>{if(this.props?.actionProps?.context?.chatroom_wizard_search){const defaultButton=this.modalRef.el.querySelector('.modal-footer button.o-default-button')
defaultButton.classList.add('d-none')}},()=>[])},}
patch(ActionDialog.prototype,chatroomDialogHack)
return __exports;});;
odoo.define('@d1abc245ae381d3b54c1221e02f71141b51cc21670997b53445ee1a77a23739f',['@web/core/utils/patch','@web/search/control_panel/control_panel'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ControlPanel}=require('@web/search/control_panel/control_panel')
const chatroomBreadcrumb={onBreadcrumbClicked(jsId){if(this.env.chatBus){if(this.breadcrumbs.findIndex(item=>item.jsId===jsId)){super.onBreadcrumbClicked(jsId)}else{}}else{super.onBreadcrumbClicked(jsId)}}}
patch(ControlPanel.prototype,chatroomBreadcrumb)
return __exports;});;
odoo.define('@7786438cd71f02c0379165c08de97c669ab6ee7861ac0cfabdfc27ed36dc9c2f',['@web/core/utils/numbers','@web/core/l10n/translation','@web/views/fields/file_handler','@web/core/utils/urls','@web/session'],function(require){'use strict';let __exports={};const{humanNumber}=require('@web/core/utils/numbers')
const{_t}=require('@web/core/l10n/translation')
const{FileUploader:FileUploaderBase}=require('@web/views/fields/file_handler')
const{getDataURLFromFile}=require('@web/core/utils/urls')
const{session}=require('@web/session')
const DEFAULT_MAX_FILE_SIZE=2*1024*1024
__exports.checkFileSize=checkFileSize;function checkFileSize(fileSize,notificationService){const maxUploadSize=session.chatroom_max_file_upload_size||DEFAULT_MAX_FILE_SIZE
if(fileSize>maxUploadSize){notificationService.add(_t('The selected file (%sB) is over the maximum allowed file size (%sB).',humanNumber(fileSize),humanNumber(maxUploadSize)),{type:'danger',})
return false}
return true}
const FileUploader=__exports.FileUploader=class FileUploader extends FileUploaderBase{async onFileChange(ev){if(!ev.target.files.length){return}
const{target}=ev
for(const file of ev.target.files){if(!checkFileSize(file.size,this.notification)){return null}
this.state.isUploading=true
const data=await getDataURLFromFile(file)
if(!file.size){console.warn(`Error while uploading file : ${file.name}`)
this.notification.add(_t('There was a problem while uploading your file.'),{type:'danger',})}
try{await this.props.onUploaded({name:file.name,size:file.size,type:file.type,data:data.split(',')[1],objectUrl:file.type==='application/pdf'?URL.createObjectURL(file):null,})}catch(e){console.error(e)}finally{this.state.isUploading=false}}
target.value=null
if(this.props.multiUpload&&this.props.onUploadComplete){this.props.onUploadComplete({})}}}
__exports[Symbol.for("default")]=FileUploader
return __exports;});;
odoo.define('@ee83fb4fd47333627b4e83065709a34856d3610ba96a2d1833b1516dbaba9acc',['@web/core/utils/patch','@web/views/form/form_controller','@odoo/owl','@web/core/utils/hooks'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{FormController}=require('@web/views/form/form_controller')
const{useSubEnv}=require('@odoo/owl')
const{useBus}=require('@web/core/utils/hooks')
const chatroomForms={setup(){super.setup()
if(this.env.chatBus){if(this.env.config){const config={...this.env.config}
config.historyBack=()=>{}
useSubEnv({config})}
useBus(this.env.chatBus,'updateChatroomAction',async({detail:chatroomTab})=>{if(this.props.chatroomTab===chatroomTab){await this.model.load()}})
useBus(this.env.chatBus,'updateConversation',async()=>{await this.model.load()})}},updateURL(){if(this.env.chatBus){}else{super.updateURL()}},async discard(){await super.discard()
if(this.env.chatBus){if(this.model.root.isNew&&this.props.resId){await this.model.load({resId:this.props.resId})}}}}
patch(FormController.prototype,chatroomForms)
patch(FormController.props,{chatroomTab:{type:String,optional:true},searchButton:{type:Boolean,optional:true},searchButtonString:{type:String,optional:true},searchAction:{type:Function,optional:true},})
return __exports;});;
odoo.define('@19280e3b2c4bdda942bce43cac714d2ea7b197d938f1048dbcd95b3a53b3ad3e',['@web/core/utils/patch','@web/views/kanban/kanban_controller','@web/core/utils/hooks'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{KanbanController}=require('@web/views/kanban/kanban_controller')
const{useBus}=require('@web/core/utils/hooks')
const chatroomKanban={setup(){super.setup()
if(this.props?.chatroomTab&&this.env.chatBus){useBus(this.env.chatBus,'updateChatroomAction',async({detail:chatroomTab})=>{if(this.props.chatroomTab===chatroomTab){await this.model.root.load()
await this.onUpdatedPager()
this.render(true)}})
useBus(this.env.chatBus,'updateConversation',async()=>{await this.model.load()})}},async openRecord(record,mode){if(this.props?.chatroomTab&&this.props?.chatroomOpenRecord){await this.props?.chatroomOpenRecord(record,mode)}else{await super.openRecord(record,mode)}}}
patch(KanbanController.prototype,chatroomKanban)
patch(KanbanController.props,{chatroomTab:{type:String,optional:true},chatroomOpenRecord:{type:Function,optional:true},})
return __exports;});;
odoo.define('@5a439c50a088acb448703ccbd9a1265e05b30374bcb383d054659e27bd711c45',['@web/core/utils/patch','@web/views/kanban/kanban_renderer'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{KanbanRenderer}=require('@web/views/kanban/kanban_renderer')
const chatroomKanban={async sortRecordDrop(dataRecordId,dataGroupId,{element,parent,previous}){let record=null
if(this.env.chatBus){const targetGroupId=parent&&parent.dataset.id
const sourceGroup=this.props.list.groups.find((g)=>g.id===dataGroupId)
const targetGroup=this.props.list.groups.find((g)=>g.id===targetGroupId)
if(sourceGroup&&targetGroup){record=sourceGroup.list.records.find((r)=>r.id===dataRecordId)}}
await super.sortRecordDrop(dataRecordId,dataGroupId,{element,parent,previous})
if(this.env.chatBus&&record){await this.env.services.orm.call(this.env.chatModel,'update_conversation_bus',[[record.resId]],{context:this.env.context})}}}
patch(KanbanRenderer.prototype,chatroomKanban)
return __exports;});;
odoo.define('@ea2db3fd0e9ecb37bdac2b5bcd0b07416cdd4bbbcc2d45dc99677b5e6f834257',['@web/core/utils/patch','@web/views/list/list_controller','@web/core/utils/hooks'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ListController}=require('@web/views/list/list_controller')
const{useBus}=require('@web/core/utils/hooks')
const chatroomLits={setup(){super.setup()
if(this.props?.chatroomTab){this.archInfo.headerButtons=[]
if(this.env.chatBus){useBus(this.env.chatBus,'updateChatroomAction',async({detail:chatroomTab})=>{if(this.props.chatroomTab===chatroomTab){await this.model.load()}})
useBus(this.env.chatBus,'updateConversation',async()=>{await this.model.load()})}}},async chatroomSelect(){const[selected]=await this.getSelectedResIds()
if(this.model?.root?.records){const record=this.model.root.records.find(record=>record.resId===selected)
if(record){await this.props.chatroomSelect(record)}}}}
patch(ListController.prototype,chatroomLits)
patch(ListController.props,{showButtons:{type:Boolean,optional:true},chatroomTab:{type:String,optional:true},chatroomSelect:{type:Function,optional:true},})
return __exports;});;
odoo.define('@3649d5fd8a43bbb30066c2e006f97400253ce22e14177253a704991fcd5fc224',['@odoo/owl','@web/core/l10n/translation','@web/core/utils/concurrency','@web/core/utils/hooks','@mail/utils/common/misc','@ff901afc2e3d24f68bdb4d2da86acd8e755824b10a5ed768565703bedd88ac9b'],function(require){'use strict';let __exports={};const{useState}=require('@odoo/owl')
const{_t}=require('@web/core/l10n/translation')
const{Deferred}=require('@web/core/utils/concurrency')
const{useBus,useService}=require('@web/core/utils/hooks')
const{assignDefined}=require('@mail/utils/common/misc')
const{Attachment}=require('@ff901afc2e3d24f68bdb4d2da86acd8e755824b10a5ed768565703bedd88ac9b')
function dataUrlToBlob(data,type){const binData=window.atob(data)
const uiArr=new Uint8Array(binData.length)
uiArr.forEach((_,index)=>(uiArr[index]=binData.charCodeAt(index)))
return new Blob([uiArr],{type})}
let nextId=-1
function getNextId(){const tmpId=nextId--
return`chatroom${tmpId}`}
__exports.useAttachmentUploader=useAttachmentUploader;function useAttachmentUploader({onFileUploaded,buildFormData}){const{bus,upload}=useService('file_upload')
const notificationService=useService('notification')
const rpc=useService('rpc')
const ui=useService('ui')
const abortByAttachmentId=new Map()
const deferredByAttachmentId=new Map()
const uploadingAttachmentIds=new Set()
const state=useState({uploadData({data,name,type}){const file=new File([dataUrlToBlob(data,type)],name,{type})
return this.uploadFile(file)},async uploadFile(file,{silent=false}={}){const tmpId=getNextId()
uploadingAttachmentIds.add(tmpId)
await upload('/web/binary/upload_attachment_chat',[file],{buildFormData(formData){buildFormData?.(formData)
formData.append('is_pending',false)
formData.append('temporary_id',tmpId)},}).catch((e)=>{if(e.name!=='AbortError'){throw e}});const uploadDoneDeferred=new Deferred()
deferredByAttachmentId.set(tmpId,uploadDoneDeferred)
let out=uploadDoneDeferred
if(silent){out=new Deferred()
uploadDoneDeferred.then(attachment=>out.resolve(attachment)).catch(()=>out.resolve(null))}
return out},async unlink(attachment,{silent=false}={}){const abort=abortByAttachmentId.get(attachment.id)
const def=deferredByAttachmentId.get(attachment.id)
if(abort){abort()
def.resolve()}
abortByAttachmentId.delete(attachment.id)
deferredByAttachmentId.delete(attachment.id)
try{await rpc('/mail/attachment/delete',assignDefined({attachment_id:attachment.id},{access_token:attachment.accessToken}))}catch(e){if(!silent){throw e}}},clear(){abortByAttachmentId.clear()
deferredByAttachmentId.clear()
uploadingAttachmentIds.clear()},})
useBus(bus,'FILE_UPLOAD_ADDED',({detail:{upload}})=>{const tmpId=upload.data.get('temporary_id')
if(uploadingAttachmentIds.has(tmpId)){ui.block()}})
useBus(bus,'FILE_UPLOAD_LOADED',({detail:{upload}})=>{const tmpId=upload.data.get('temporary_id')
if(uploadingAttachmentIds.has(tmpId)){ui.unblock()
const def=deferredByAttachmentId.get(tmpId)
uploadingAttachmentIds.delete(tmpId)
abortByAttachmentId.delete(tmpId)
if(upload.xhr.status===413){notificationService.add(_t('File too large'),{type:'danger'})
return def.reject()}
if(upload.xhr.status!==200){notificationService.add(_t('Server error'),{type:'danger'})
return def.reject()}
const response=JSON.parse(upload.xhr.response)
if(response.error){notificationService.add(response.error,{type:'danger'})
return def.reject()}
const attachmentData={...response,uploading:false,extension:upload.title.split('.').pop(),}
const attachment=new Attachment()
assignDefined(attachment,attachmentData,['id','checksum','filename','mimetype','name','type','url','uploading','extension','accessToken','tmpUrl','message','isAcrux',])
if(def){def.resolve(attachment)
deferredByAttachmentId.delete(tmpId)}
onFileUploaded?.(attachment)}})
useBus(bus,'FILE_UPLOAD_ERROR',({detail:{upload}})=>{const tmpId=upload.data.get('temporary_id')
if(uploadingAttachmentIds.has(tmpId)){ui.unblock()
abortByAttachmentId.delete(tmpId)
deferredByAttachmentId.delete(tmpId)
uploadingAttachmentIds.delete(upload.data.get('temporary_id'))}})
return state}
return __exports;});;
odoo.define('@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca',[],function(require){'use strict';let __exports={};const ChatBaseModel=__exports.ChatBaseModel=class ChatBaseModel{constructor(comp){this.env=comp.env}
updateFromJson(){}
async buildExtraObj(){}
convertRecordField(record,extraFields){let out
if(record){out={id:record[0],name:record[1]}
for(let i=2,j=0;i<record.length&&j<extraFields.length;++i,++j){out[extraFields[j]]=record[i]}}else{out={id:false,name:''}
if(extraFields){for(const extraField of extraFields){out[extraField]=''}}}
return out}
convertFieldRecord(record,extraFields){let out=[false,'']
if(record){out=[record.id,record.name]
for(const extraField of extraFields){out.push(record[extraField])}}else{extraFields.forEach(()=>out.push(''))}
return out}}
return __exports;});;
odoo.define('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef',['@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca','@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a','@web/core/l10n/dates'],function(require){'use strict';let __exports={};const{ChatBaseModel}=require('@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca')
const{MessageModel}=require('@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a')
const{deserializeDateTime}=require('@web/core/l10n/dates')
const ConversationModel=__exports.ConversationModel=class ConversationModel extends ChatBaseModel{constructor(comp,base){super(comp)
this.env
this.id=false
this.name=''
this.number=''
this.numberFormat=''
this.status='new'
this.borderColor='#FFFFFF'
this.imageUrl=''
this.team={id:false,name:''}
this.partner={id:false,name:''}
this.agent={id:false,name:''}
this.connector={id:false,name:''}
this.connectorType=''
this.showIcon=false
this.allowSigning=false
this.assigned=false
this.messages=[]
this.messagesIds=new Set()
this.countNewMsg=0
this.lastActivity=luxon.DateTime.now()
this.tagIds=[]
this.note=''
this.allowedLangIds=[]
this.convType='normal'
this.oldesActivityDate=null
this.freeText=''
this.data={}
if(base){this.updateFromJson(base)}
this.model={load:this.load.bind(this)}}
updateFromJson(base){super.updateFromJson(base)
if('id'in base){this.id=base.id
this.resId=base.id
this.resModel='acrux.chat.conversation'}
if('name'in base){this.name=base.name}
if('number'in base){this.number=base.number}
if('number_format'in base){this.numberFormat=base.number_format}
if('status'in base){this.status=base.status}
if('border_color'in base){this.borderColor=base.border_color}
if('image_url'in base){this.imageUrl=base.image_url}
if('team_id'in base){this.team=this.convertRecordField(base.team_id)}
if('res_partner_id'in base){this.partner=this.convertRecordField(base.res_partner_id)}
if('agent_id'in base){this.agent=this.convertRecordField(base.agent_id)}
if('connector_id'in base){this.connector=this.convertRecordField(base.connector_id)}
if('connector_type'in base){this.connectorType=base.connector_type}
if('show_icon'in base){this.showIcon=base.show_icon}
if('allow_signing'in base){this.allowSigning=base.allow_signing}
if('assigned'in base){this.assigned=base.assigned}
if('messages'in base){this.appendMessages(base.messages)}
if('last_activity'in base){this.lastActivity=deserializeDateTime(base.last_activity)}
if('tag_ids'in base){this.tagIds=base.tag_ids}
if('note'in base){this.note=base.note}
if('allowed_lang_ids'in base){this.allowedLangIds=base.allowed_lang_ids}
if('conv_type'in base){this.convType=base.conv_type}
if('oldes_activity_date'in base){this.oldesActivityDate=deserializeDateTime(base.oldes_activity_date)}
if('free_text'in base){this.freeText=base.free_text}
this.data=Object.assign({},this.data,base)
if('activity_ids'in this.data){if(Array.isArray(this.data.activity_ids)){this.data.activity_ids={currentIds:this.data.activity_ids,records:[]}}}}
copyFromObj(conv){Object.assign(this,conv)
for(const msg of this.messages){msg.conversation=this}}
async buildExtraObj(){await super.buildExtraObj()
for await(const msg of this.messages){await msg.buildExtraObj()}}
async load(){const result=await this.env.services.orm.call(this.env.chatModel,'build_dict',[[this.id]],{context:this.env.context,limit:22})
this.env.services.bus_service.trigger('notification',[{type:'update_conversation',payload:result,}])}
appendMessages(messages){if(messages?.length>0){const newMessages=[]
for(const msg of messages){if(this.messagesIds.has(msg.id)){const oldMsg=this.messages.find(item=>item.id===msg.id)
oldMsg.updateFromJson(msg)}else{newMessages.push(new MessageModel(this,msg))}}
for(const msg of newMessages){this.messagesIds.add(msg.id)}
this.messages.push(...newMessages)
this.messages.sort((a,b)=>a.id-b.id)}
this.calculateMessageCount()}
calculateMessageCount(){if(['new','current'].includes(this.status)){const messages=this.messages.filter(msg=>!msg.ttype.startsWith('info'))
let lastIndexOf
if(Array.prototype.findLastIndex){lastIndexOf=messages.findLastIndex(msg=>msg.fromMe)}else{lastIndexOf=messages.map(msg=>msg.fromMe).lastIndexOf(true)}
this.countNewMsg=messages.length-(lastIndexOf+1)}else{this.countNewMsg=0}}
async syncMoreMessage(){if(this.messages.length>=22){const result=await this.env.services.orm.call(this.env.chatModel,'build_dict',[[this.id]],{context:this.env.context,limit:22,offset:this.messages.length})
this.appendMessages(result[0].messages)
await this.buildExtraObj()}}
async createMessage(options){let msg=new MessageModel(this,options)
const jsonData=msg.exportToVals()
if(options.custom_field){jsonData[options.custom_field]=true}
const result=await this.env.services.orm.call(this.env.chatModel,'send_message',[[this.id],jsonData],{context:this.env.context})
msg.updateFromJson(result[0])
await msg.buildExtraObj()
if(this.messagesIds.has(msg.id)){msg=this.messages.find(msg2=>msg2.id===msg.id)}else{this.messagesIds.add(msg.id)
this.messages.push(msg)}
this.lastActivity=luxon.DateTime.now()
this.env.chatBus.trigger('mobileNavigate','middleSide')
this.calculateMessageCount()
return msg}
async sendProduct(productId){await this.env.services.orm.call(this.env.chatModel,'send_message_product',[[this.id],parseInt(productId)],{context:this.env.context})}
async messageSeen(){try{await this.env.services.orm.silent.call(this.env.chatModel,'conversation_send_read',[[this.id]],{context:this.env.context})}catch(e){console.error(e)}}
isMine(){return(this.status==='current'&&this.agent.id===this.env.services.user.userId)}
isCurrent(){let out=this.status==='current'
if(!this.env.isAdmin()){out=out&&this.agent.id===this.env.services.user.userId}
return out}
getIconClass(){let out='acrux_whatsapp'
if(this.connectorType==='facebook'){out='acrux_messenger'}else if(this.connectorType==='instagram'){out='acrux_instagram'}else if(this.isWechat()){out='acrux_wechat'}
return out}
async block(){const conv=await this.env.services.orm.call(this.env.chatModel,'block_conversation',[this.id],{context:this.env.context})
this.updateFromJson(conv[0])
this.assigned=false}
async release(){await this.env.services.orm.call(this.env.chatModel,'release_conversation',[this.id],{context:this.env.context})}
get lastMessage(){let out=null
if(this.messages.length){const messages=this.messages.filter(msg=>msg.ttype!=='info')
if(messages.length){out=messages[messages.length-1]}}
return out}
get isPrivate(){return this.convType==='private'}
get isGroup(){return this.convType==='group'}
async selected(){if(this.isCurrent()){this.messageSeen()}
this.assigned=false}
async close(){try{await this.env.services.orm.silent.call(this.env.chatModel,'close_from_ui',[[this.id]],{context:this.env.context})}catch(e){console.error(e)}}
isOwnerFacebook(){return['facebook','instagram','waba_extern'].includes(this.connectorType)}
isWabaExtern(){return this.connectorType==='waba_extern'}
isWechat(){return this.connectorType==='wechat'}}
return __exports;});;
odoo.define('@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1',['@9f550e3a7c92bb06c3fddba4f99a7b9e71b1ac051716574055e7bf82d8432aaf'],function(require){'use strict';let __exports={};const{MessageBaseModel}=require('@9f550e3a7c92bb06c3fddba4f99a7b9e71b1ac051716574055e7bf82d8432aaf')
const DefaultAnswerModel=__exports.DefaultAnswerModel=class DefaultAnswerModel extends MessageBaseModel{constructor(comp,base){super(comp)
this.env
this.name=''
this.sequence=0
this.connector={id:false,name:''}
if(base){this.updateFromJson(base)}}
updateFromJson(base){super.updateFromJson(base)
if('name'in base){this.name=base.name}
if('sequence'in base){this.sequence=base.sequence}
if('connector_id'in base){this.connector=this.convertRecordField(base.connector_id)}}}
return __exports;});;
odoo.define('@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a',['@web/core/l10n/translation','@web/core/l10n/dates','@mail/utils/common/misc','@9f550e3a7c92bb06c3fddba4f99a7b9e71b1ac051716574055e7bf82d8432aaf','@ff901afc2e3d24f68bdb4d2da86acd8e755824b10a5ed768565703bedd88ac9b'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{deserializeDateTime,formatDateTime,formatDate,serializeDateTime}=require('@web/core/l10n/dates')
const{assignDefined}=require('@mail/utils/common/misc')
const{MessageBaseModel}=require('@9f550e3a7c92bb06c3fddba4f99a7b9e71b1ac051716574055e7bf82d8432aaf')
const{Attachment}=require('@ff901afc2e3d24f68bdb4d2da86acd8e755824b10a5ed768565703bedd88ac9b')
const{DateTime}=luxon
const MessageModel=__exports.MessageModel=class MessageModel extends MessageBaseModel{constructor(comp,base){super(comp)
this.env
this.conversation=comp
this.fromMe=false
this.errorMsg=''
this.showProductText=false
this.dateMessage=luxon.DateTime.now()
this.location=null
this.resModelObj=null
this.titleColor='#000000'
this.metadataType=null
this.metadataJson=null
this.createUid={id:false,name:''}
this.transcription=null
this.transcription=null
this.traduction=null
this.urlDue=false
this.customUrl=''
this.contactName=''
this.contactNumber=''
this.quote=null
this.dateDelete=null
if(base){this.updateFromJson(base)}}
updateFromJson(base){super.updateFromJson(base)
if('from_me'in base){this.fromMe=base.from_me}
if('error_msg'in base){this.errorMsg=base.error_msg}
if('show_product_text'in base){this.showProductText=base.show_product_text}
if('res_model_obj'in base){this.resModelObj=base.res_model_obj}
if('date_message'in base){this.dateMessage=base.date_message
if(this.dateMessage){this.convertDate('dateMessage')}}
if(this.ttype=='location'){this.createLocationObj();}
if('title_color'in base){this.titleColor=base.title_color
this.titleColor=this.titleColor!='#FFFFFF'?this.titleColor:'#000000'}
if('metadata_type'in base){this.metadataType=base.metadata_type}
if('metadata_json'in base){this.metadataJson=base.metadata_json}
if('create_uid'in base){this.createUid=this.convertRecordField(base.create_uid)}
if('transcription'in base){this.transcription=base.transcription}
if('traduction'in base){this.traduction=base.traduction}
if('url_due'in base){this.urlDue=base.url_due}
if('custom_url'in base){this.customUrl=base.custom_url}
if(this.ttype==='url'&&this.text){const subTypes={story_mention:_t('A story mention you.')}
if(this.text in subTypes){this.text=subTypes[this.text]}}
if('contact_name'in base){this.contactName=base.contact_name}
if('contact_number'in base){this.contactNumber=base.contact_number}
if('date_delete'in base){this.dateDelete=base.date_delete
if(this.dateDelete){this.convertDate('dateDelete')}}
if('quote_id'in base){if(base.quote_id){if(base.quote_id instanceof MessageModel){this.quote=base.quote_id}else{const quote_id={...base.quote_id}
if(quote_id.metadata_type){delete(quote_id.metadata_type)}
if(quote_id.button_ids){delete(quote_id.button_ids)}
this.quote=new MessageModel(this.conversation,quote_id)}}else{this.quote=null}}}
exportToJson(){const out={}
out.text=this.text
out.from_me=this.fromMe
out.ttype=this.ttype
out.res_model=this.resModel
out.res_id=this.resId
if(this.id){out.id=this.id}
out.title_color=this.titleColor
if(this.dateMessage){out.date_message=serializeDateTime(this.dateMessage)}
if(this.metadataType){out.metadata_type=this.metadataType}
if(this.metadataJson){out.metadata_json=this.metadataJson}
if(this.buttons){out.button_ids=this.buttons}
if(this.createUid.id){out.create_uid=[this.createUid.id,this.createUid.name]}
if(this.chatList.id){out.chat_list_id=this.chatListRecord}
if(this.transcription){out.transcription=this.transcription}
if(this.traduction){out.traduction=this.traduction}
if(this.quote){out.quote_id=this.quote.exportToJson()}
if(this.dateDelete){out.date_delete=serializeDateTime(this.dateDelete)}
return out}
exportToVals(){const out=this.exportToJson()
delete out.title_color
if(out.button_ids){out.button_ids=out.button_ids.map(btn=>[0,0,btn])}
if(out.create_uid){delete out.create_uid}
if(out.chat_list_id&&out.chat_list_id[0]){out.chat_list_id=out.chat_list_id[0]}
if(out.quote_id){out.quote_id=out.quote_id.id}
return out}
async buildExtraObj(){await super.buildExtraObj()
if(this.resModelObj){this.buildResModelObj(this.resModelObj)
this.resModelObj.message=this}else{if(this.resModel){const result=await this.env.services.orm.call(this.resModel,'read_from_chatroom',[this.resId],{context:this.env.context})
this.resModelObj={}
if(result.length){result[0].displayName=result[0].display_name
this.buildResModelObj(result[0])}}
if(this.ttype==='url'){this.resModelObj={}
if(!this.urlDue){const data=await this.env.services.orm.call('acrux.chat.message','check_url_due',[this.id],{context:this.env.context})
this.urlDue=data.url_due
if(!this.urlDue){this.resModelObj=data}}}}
if(this.quote){await this.quote.buildExtraObj()}}
buildResModelObj(attachRes){const attach={...attachRes}
if(this.isProductType){const{res_model,res_id,res_field}=attach
this.resModelObj=attach
this.resModelObj.src=`/web/image?model=${res_model}&id=${res_id}&field=${res_field}`}else{if(['audio','sticker'].includes(this.ttype)){this.resModelObj=attach
this.resModelObj.src=`/web/content/${this.resModelObj.id}`}else{this.resModelObj=this.createAttachObject(attach)}}}
get date(){return formatDate(this.dateMessage)}
get dateFull(){let dateDay=this.dateMessage.toLocaleString(DateTime.DATE_FULL)
if(dateDay===DateTime.now().toLocaleString(DateTime.DATE_FULL)){dateDay=_t('Today')}
return dateDay}
get dateFullTime(){return this.dateMessage.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)}
get hour(){return formatDateTime(this.dateMessage,{format:'HH:mm'})}
get isProductType(){return this.ttype==='image'&&this.isProduct}
get authorName(){let name=false
if(this.contactName&&this.contactNumber){name=`${this.contactName} (${this.contactNumber})`}else{name=this.contactName||this.contactNumber}
return this.fromMe?'':name}
createLocationObj(){if(this.text){try{let text=this.text.split('\n')
let locObj={}
locObj.displayName=text[0].trim()
locObj.address=text[1].trim()
locObj.coordinate=text[2].trim()
text=locObj.coordinate.replace('(','').replace(')','')
text=text.split(',')
locObj.coordinate={x:text[0].trim(),y:text[1].trim()}
const lang=navigator.language||navigator.userLanguage
const hl=lang.split('-')[0]
if(!locObj.displayName||locObj.displayName.startsWith('Location:')){locObj.mapUrl=`https://maps.google.com/maps?q=${locObj.coordinate.x},${locObj.coordinate.y}&z=17&hl=${hl}`}else{locObj.mapUrl='https://maps.google.com/maps/search/'
locObj.mapUrl+=`${locObj.displayName}/@${locObj.coordinate.x},${locObj.coordinate.y},17z?hl=${hl}`}
locObj.mapUrl=encodeURI(locObj.mapUrl)
this.location=locObj}catch(err){console.log('error location')
console.log(err)}}}
convertDate(field){if(this[field]&&(this[field]instanceof String||typeof this[field]==='string')){this[field]=deserializeDateTime(this[field])}}
createAttachObject(attachmentData){const attachment=new Attachment()
attachmentData['message']=this
attachmentData['uploading']=false
assignDefined(attachment,attachmentData,['id','checksum','filename','mimetype','name','type','url','uploading','extension','accessToken','tmpUrl','message',]);if(!('extension'in attachmentData)&&attachmentData['name']){attachment.extension=attachment.name.split('.').pop();}
return attachment}
canBeAnswered(){return(!this.dateDelete&&(!this.conversation.isOwnerFacebook()||this.conversation.isWabaExtern())&&!this.conversation.isWechat())}
canBeDeleted(){return(!this.dateDelete&&this.fromMe&&!this.conversation.isOwnerFacebook()&&!this.conversation.isWechat())}
hasTitle(){return!this.fromMe&&this.authorName}}
return __exports;});;
odoo.define('@9f550e3a7c92bb06c3fddba4f99a7b9e71b1ac051716574055e7bf82d8432aaf',['@odoo/owl','@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca'],function(require){'use strict';let __exports={};const{markup}=require('@odoo/owl')
const{ChatBaseModel}=require('@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca')
const MessageBaseModel=__exports.MessageBaseModel=class MessageBaseModel extends ChatBaseModel{constructor(comp,base){super(comp)
this.env
this.id=false
this.text=''
this.textHTML=''
this.ttype=''
this.resModel=''
this.resId=0
this.isProduct=false
this.buttons=[]
this.chatList={id:false,name:'',buttonText:''}
if(base){this.updateFromJson(base)}}
updateFromJson(base){super.updateFromJson(base)
if('id'in base){this.id=base.id}
if('text'in base){this.text=base.text
this.textHTML=markup(this.parseHTML(this.text))}
if('ttype'in base){this.ttype=base.ttype}
if('res_model'in base){this.resModel=base.res_model}
if('res_id'in base){this.resId=base.res_id}
if('is_product'in base){this.isProduct=base.is_product}
if('button_ids'in base){this.buttons=[...base.button_ids]}
if('chat_list_id'in base){this.chatList=this.convertRecordField(base.chat_list_id,['buttonText'])}}
get chatListRecord(){return this.convertFieldRecord(this.chatList,['buttonText'])}
parseHTML(text){const regexBold=/(?:^\*|\s\*)(?:(?!\s))((?:(?!\*|\n|<|>).)+)(?:\*)(?=(\s|,|\.|$))/g
const textBold=(text||'').replace(regexBold,' <strong>$1</strong>')
const regexDel=/(?:^~|\s~)(?:(?!\s))((?:(?!~|\n|<|>).)+)(?:~)(?=(\s|,|\.|$))/g
const textDel=textBold.replace(regexDel,' <del>$1</del>')
const regexUnder=/(?:^_|\s_)(?:(?!\s))((?:(?!_|\n|<|>).)+)(?:_)(?=(\s|,|\.|$))/g
const textUnder=textDel.replace(regexUnder,' <em>$1</em>')
const regexURLs=/(https?:\/\/[^\s]+)/g
const textHTML=textUnder.replace(regexURLs,url=>{url=url.replace(/<\/?[^>]+(>|$)/g,"");return`<a href="${url}" target="_blank">${url}</a>`})
return textHTML}}
return __exports;});;
odoo.define('@a57f7a72eb29be2e68a9675edd680394d67e2ecd8df85dc2c38e83822c8551e8',['@web/core/l10n/dates','@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca'],function(require){'use strict';let __exports={};const{parseDateTime,formatDateTime}=require('@web/core/l10n/dates')
const{ChatBaseModel}=require('@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca')
const ProductModel=__exports.ProductModel=class ProductModel extends ChatBaseModel{constructor(comp,base){super(comp)
this.env
this.id=false
this.displayName=''
this.lstPrice=0.0
this.uom={id:false,name:''}
this.writeDate=null
this.productTmpl={id:false,name:''}
this.name=''
this.type=''
this.defaultCode=''
this.qtyAvailable=0.0
this.showProductText=true
this.uniqueHashImage=''
this.showOptions=true
if(base){this.updateFromJson(base)}}
updateFromJson(base){super.updateFromJson(base)
if('id'in base){this.id=base.id}
if('display_name'in base){this.displayName=base.display_name}
if('lst_price'in base){this.lstPrice=base.lst_price}
if('uom_id'in base){this.uom=this.convertRecordField(base.uom_id)}
if('write_date'in base){this.writeDate=parseDateTime(base.write_date)
this.uniqueHashImage=formatDateTime(this.writeDate).replace(/[^0-9]/g,'')}
if('product_tmpl_id'in base){this.productTmpl=this.convertRecordField(base.product_tmpl_id)}
if('name'in base){this.name=base.name}
if('type'in base){this.type=base.type}
if('default_code'in base){this.defaultCode=base.default_code}
if('qty_available'in base){this.qtyAvailable=base.qty_available}
if('show_product_text'in base){this.showProductText=base.show_product_text}
if('show_options'in base){this.showOptions=base.show_options}}}
return __exports;});;
odoo.define('@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a',['@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca'],function(require){'use strict';let __exports={};const{ChatBaseModel}=require('@3c372604289611a498f68f71210a86a252c33aeb332b42905c018f29098599ca')
const UserModel=__exports.UserModel=class UserModel extends ChatBaseModel{constructor(comp,base){super(comp)
this.env
this.id=0
this.status=false
this.signingActive=false
this.tabOrientation='vertical'
if(base){this.updateFromJson(base)}}
updateFromJson(base){super.updateFromJson(base)
if('id'in base){this.id=base.id}
if('acrux_chat_active'in base){this.status=base.acrux_chat_active}
if('chatroom_signing_active'in base){this.signingActive=base.chatroom_signing_active}
if('chatroom_tab_orientation'in base){this.tabOrientation=base.chatroom_tab_orientation}}}
return __exports;});;
odoo.define('@40aca894c21e4515549a3a5d23148601f5e3b684104bff0b1e4c01d5a8c39741',['@web/core/utils/patch','@odoo/owl','@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{markup}=require('@odoo/owl')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const AiIntefaceForm=__exports.AiIntefaceForm=class AiIntefaceForm extends ChatroomActionTab{setup(){super.setup()
this.env;}
static iconHtml=markup(`
<svg data-name="OpenAI Logo" width="16px" height="16px" viewBox="140 140 520 520">
    <defs>
        <linearGradient id="linear" x1="100%" y1="22%" x2="0%" y2="78%">
            <stop offset="0%" stop-color="rgb(131,211,231)"></stop>
            <stop offset="2%" stop-color="rgb(127,203,229)"></stop>
            <stop offset="25%" stop-color="rgb(86,115,217)"></stop>
            <stop offset="49%" stop-color="rgb(105,80,190)"></stop>
            <stop offset="98%" stop-color="rgb(197,59,119)"></stop>
            <stop offset="100%" stop-color="rgb(197,59,119)"></stop>
        </linearGradient>
    </defs>
    <path id="logo" d="m617.24 354a126.36 126.36 0 0 0 -10.86-103.79 127.8 127.8 0 0 0 
        -137.65-61.32 126.36 126.36 0 0 0 -95.31-42.49 127.81 127.81 0 0 0 -121.92 88.49 
        126.4 126.4 0 0 0 -84.5 61.3 127.82 127.82 0 0 0 15.72 149.86 126.36 126.36 0 0 0 
        10.86 103.79 127.81 127.81 0 0 0 137.65 61.32 126.36 126.36 0 0 0 95.31 42.49 
        127.81 127.81 0 0 0 121.96-88.54 126.4 126.4 0 0 0 84.5-61.3 127.82 127.82 0 0 0 
        -15.76-149.81zm-190.66 266.49a94.79 94.79 0 0 1 -60.85-22c.77-.42 2.12-1.16 
        3-1.7l101-58.34a16.42 16.42 0 0 0 8.3-14.37v-142.39l42.69 24.65a1.52 1.52 0 0 
        1 .83 1.17v117.92a95.18 95.18 0 0 1 -94.97 95.06zm-204.24-87.23a94.74 94.74 0 
        0 1 -11.34-63.7c.75.45 2.06 1.25 3 1.79l101 58.34a16.44 16.44 0 0 0 16.59 
        0l123.31-71.2v49.3a1.53 1.53 0 0 1 -.61 1.31l-102.1 58.95a95.16 95.16 0 0 1 
        -129.85-34.79zm-26.57-220.49a94.71 94.71 0 0 1 49.48-41.68c0 .87-.05 2.41-.05 
        3.48v116.68a16.41 16.41 0 0 0 8.29 14.36l123.31 71.19-42.69 24.65a1.53 1.53 0 
        0 1 -1.44.13l-102.11-59a95.16 95.16 0 0 1 -34.79-129.81zm350.74 81.62-123.31-71.2 
        42.69-24.64a1.53 1.53 0 0 1 1.44-.13l102.11 58.95a95.08 95.08 0 0 1 -14.69 
        171.55c0-.88 0-2.42 0-3.49v-116.68a16.4 16.4 0 0 0 
        -8.24-14.36zm42.49-63.95c-.75-.46-2.06-1.25-3-1.79l-101-58.34a16.46 16.46 0 0 
        0 -16.59 0l-123.31 71.2v-49.3a1.53 1.53 0 0 1 .61-1.31l102.1-58.9a95.07 95.07 
        0 0 1 141.19 98.44zm-267.11 87.87-42.7-24.65a1.52 1.52 0 0 1 -.83-1.17v-117.92a95.07 95.07 
        0 0 1 155.9-73c-.77.42-2.11 1.16-3 1.7l-101 58.34a16.41 16.41 0 0 0 -8.3 
        14.36zm23.19-50 54.92-31.72 54.92 31.7v63.42l-54.92 31.7-54.92-31.7z" fill="currentColor"></path>
</svg>`)}
AiIntefaceForm.props=Object.assign({},AiIntefaceForm.props)
AiIntefaceForm.defaultProps=Object.assign({},AiIntefaceForm.defaultProps)
patch(AiIntefaceForm.props,{viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},selectedConversation:{type:ConversationModel.prototype},})
patch(AiIntefaceForm.defaultProps,{viewModel:'acrux.chat.ai.interface',viewType:'form',viewKey:'aiInteface_form',})
return __exports;});;
odoo.define('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb',['@web/core/l10n/translation','@web/core/browser/browser','@odoo/owl','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{browser}=require('@web/core/browser/browser')
const{Component,xml,onWillStart,onWillDestroy,onWillUpdateProps,useRef}=require('@odoo/owl')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const ChatroomActionTab=__exports.ChatroomActionTab=class ChatroomActionTab extends Component{setup(){super.setup()
this.env;this.props;this.info={}
this.elRef=useRef('elRef')
const onActionManagerUpdate=this.onActionManagerUpdate.bind(this)
this.env.bus.addEventListener('ACTION_MANAGER:UPDATE',onActionManagerUpdate)
onWillDestroy(()=>this.env.bus.removeEventListener('ACTION_MANAGER:UPDATE',onActionManagerUpdate))
onWillStart(this.willStart.bind(this))
onWillUpdateProps(this.onWillUpdateProps.bind(this))}
async willStart(){await this.makeAction(this.props)}
async onWillUpdateProps(nextProps){await this.makeAction(nextProps)}
async makeAction(props){const prom=new Promise(res=>this.infoResolve=res)
this.env.services.action.doAction(this.getActionConfig(props),this.getActionOptions(props))
await prom}
onActionManagerUpdate({detail:info}){if(info?.componentProps?.chatroomTab===this.props.viewKey){this.info=info
this.info.Component=class ChatroomController extends info.Component{onMounted(){const hashOrigin=this.env.services.router?.current?.hash
const current_action=browser.sessionStorage.getItem('current_action')
super.onMounted()
browser.sessionStorage.setItem('current_action',current_action)
if(hashOrigin){this.env.services.router.replaceState(hashOrigin,{replace:true})}}}
this.infoResolve()}}
getActionConfig(props){const context={...this.env.context,...this.getExtraContext(props)}
this._contextHook(context)
return{type:'ir.actions.act_window',view_type:'form',view_mode:props.viewType,res_model:props.viewModel,views:this.getActionViews(props),target:'current',context:context,res_id:props.viewResId,flags:this.getActionFlags(props),name:props.viewTitle,}}
getActionViews(props){let out
if(props.viewType==='form'){out=[[props.viewId,props.viewType]]}else if(props.viewType==='list'){out=[[props.viewId,props.viewType],[false,'search']]}else if(props.viewType==='kanban'){out=[[props.viewId,props.viewType],[false,'search']]}else{throw new Error('Not implemented.')}
return out}
_contextHook(context){if((['res.partner','crm.lead'].includes(this.props.viewModel)&&this.props.selectedConversation?.isOwnerFacebook()&&!this.props.selectedConversation?.isWabaExtern())||this.props.selectedConversation?.isPrivate||this.props.selectedConversation?.isGroup||this.props.selectedConversation?.isWechat()){if('default_mobile'in context){delete context.default_mobile}
if('default_phone'in context){delete context.default_phone}}}
getExtraContext(props){return{default_conversation_id:props?.selectedConversation?.id}}
getActionFlags(props){let out
if(props.viewType==='form'){out={withControlPanel:false,footerToButtons:false,hasSearchView:false,hasSidebar:false,mode:'edit',searchMenuTypes:false,}}else if(props.viewType==='list'){out={withControlPanel:true,footerToButtons:false,hasSearchView:true,hasSidebar:false,searchMenuTypes:['filter','groupBy'],withSearchPanel:true,withSearchBar:true,}}else if(props.viewType==='kanban'){out={withControlPanel:true,footerToButtons:false,hasSearchView:true,hasSidebar:false,searchMenuTypes:['filter','groupBy'],withSearchPanel:true,withSearchBar:true,}}else{throw new Error('Not implemented.')}
return out}
getActionOptions(props){let stackPosition='replaceCurrentAction'
if(this.env.chatroomJsId===this.env.services.action.currentController.action.jsId){stackPosition=false}
return{clearBreadcrumbs:false,stackPosition:stackPosition,props:this.getActionProps(props),}}
getActionProps(props){const out={chatroomTab:props.viewKey}
if(props.viewType==='form'){Object.assign(out,{onSave:this.onSave.bind(this),searchButton:props.searchButton,searchButtonString:props.searchButtonString||_t('Search'),searchAction:this._onSearchChatroom.bind(this)})}else if(props.viewType==='list'){}else if(props.viewType==='kanban'){}else{throw new Error('Not implemented.')}
return out}
_getSearchAction(){const context={...this.env.context,chatroom_wizard_search:true}
return{type:'ir.actions.act_window',view_type:'form',view_mode:'list',res_model:this.props.viewModel,domain:this._getOnSearchChatroomDomain(),views:[[false,'list']],target:'new',context:context,}}
_onSearchChatroom(){const action=this._getSearchAction()
const options={props:{showButtons:false,chatroomTab:this.props.viewKey,chatroomSelect:this._onSelectedRecord.bind(this)}}
return this.env.services.action.doAction(action,options)}
_getOnSearchChatroomDomain(){return[]}
async _onSelectedRecord(record){await this.env.services.action.doAction({type:'ir.actions.act_window_close'})
await this.onSave(record)}
async onSave(record){if(this.props.viewType==='form'){if(record.data.partner_id){if(record.data.partner_id[0]!==this.props.selectedConversation.partner.id){await this.savePartner(record.data.partner_id)}}}}
async savePartner(partner){await this.env.services.orm.write(this.env.chatModel,[this.props.selectedConversation.id],{res_partner_id:partner[0]},{context:this.env.context})
const[{image_url}]=await this.env.services.orm.read(this.env.chatModel,[this.props.selectedConversation.id],['image_url'],{context:this.env.context})
this.props.selectedConversation.updateFromJson({res_partner_id:partner,image_url})
this.env.chatBus.trigger('updateConversation',this.props.selectedConversation)}
isInside(x,y){let out
const rect=this.elRef.el.getBoundingClientRect()
if(rect.top<=y&&y<=rect.bottom){out=rect.left<=x&&x<=rect.right}else{out=false}
return out}}
Object.assign(ChatroomActionTab,{props:{viewId:{type:Number,optional:true},viewModel:String,viewType:String,viewTitle:String,viewKey:String,viewResId:{type:[Number,Boolean],optional:true},selectedConversation:{type:ConversationModel.prototype,optional:true},searchButton:{type:Boolean,optional:true},searchButtonString:{type:String,optional:true},},defaultProps:{}})
ChatroomActionTab.template=xml`
    <t t-name="chatroom.ActionTab">
      <div class="o_ActionTab" t-attf-class="{{env.isVerticalView() ? 'vertical': 'horizontal'}}" t-ref="elRef">
        <t t-if="info.Component" t-component="info.Component" className="'o_action'" t-props="info.componentProps" t-key="info.id"/>
      </div>
    </t>`;return __exports;});;
odoo.define('@d3310142513a60875a36765d19fdb3dd7b162511bc1eeda32ca1cd870284e772',['@web/core/utils/patch','@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const ConversationForm=__exports.ConversationForm=class ConversationForm extends ChatroomActionTab{setup(){super.setup()
this.env;}
async onSave(record){await super.onSave(record)
await this.env.services.orm.call(this.env.chatModel,'update_conversation_bus',[record.resIds],{context:this.env.context})}}
ConversationForm.props=Object.assign({},ConversationForm.props)
ConversationForm.defaultProps=Object.assign({},ConversationForm.defaultProps)
patch(ConversationForm.props,{viewResId:{type:Number},viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},})
patch(ConversationForm.defaultProps,{viewModel:'acrux.chat.conversation',viewType:'form',viewKey:'conv_form',})
return __exports;});;
odoo.define('@6b827bd088194ec1bd28907241858b132687b2745bb08d69a01a07dbdc7f175f',['@web/core/l10n/translation','@web/core/utils/patch','@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const ConversationKanban=__exports.ConversationKanban=class ConversationKanban extends ChatroomActionTab{setup(){super.setup()
this.env;}
getActionProps(props){const out=super.getActionProps(props)
Object.assign(out,{chatroomOpenRecord:this.openRecord.bind(this)})
return out}
getExtraContext(props){return{chatroom_fold_null_group:true,...super.getExtraContext(props)}}
async openRecord(record,mode){if(mode==='edit'){const action={type:'ir.actions.act_window',name:_t('Edit'),view_type:'form',view_mode:'form',res_model:this.env.chatModel,views:[[this.props.formViewId,'form']],target:'new',res_id:record.resId,context:{...this.env.context,only_edit:true},}
const onSave=async()=>{await this.env.services.orm.call(this.env.chatModel,'update_conversation_bus',[[record.resId]],{context:this.env.context})
await this.env.services.action.doAction({type:'ir.actions.act_window_close'})}
await this.env.services.action.doAction(action,{props:{onSave}})}else{await this.env.services.orm.call(this.env.chatModel,'init_and_notify',[[record.resId]],{context:this.env.context},)}}
async onSave(record){await super.onSave(record)}}
ConversationKanban.props=Object.assign({},ConversationKanban.props)
ConversationKanban.defaultProps=Object.assign({},ConversationKanban.defaultProps)
patch(ConversationKanban.props,{viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},formViewId:{type:Number,optional:true},})
patch(ConversationKanban.defaultProps,{viewModel:'acrux.chat.conversation',viewType:'kanban',viewKey:'conv_kanban',})
return __exports;});;
odoo.define('@7c65d898248ee5e789e3fd3a146b2d7a8f1c704e8721e1d9782f3ea7abb93efc',['@web/core/utils/patch','@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const ConversationPanelForm=__exports.ConversationPanelForm=class ConversationPanelForm extends ChatroomActionTab{setup(){super.setup()
this.env;}}
ConversationPanelForm.props=Object.assign({},ConversationPanelForm.props)
ConversationPanelForm.defaultProps=Object.assign({},ConversationPanelForm.defaultProps)
patch(ConversationPanelForm.props,{viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},})
patch(ConversationPanelForm.defaultProps,{viewModel:'acrux.chat.panel',viewType:'form',viewKey:'conv_panel_form',})
return __exports;});;
odoo.define('@30bcd30850cd19012d4f3f579cc45e01e3d534df66b8203139cb8a307d419749',['@web/core/utils/patch','@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{patch}=require('@web/core/utils/patch')
const{ChatroomActionTab}=require('@103c7d79cc526d077aeb6c0d794e9325b026ab588961f8ee74e08fcae5becbcb')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const PartnerForm=__exports.PartnerForm=class PartnerForm extends ChatroomActionTab{setup(){super.setup()
this.env;this.props}
getExtraContext(props){return Object.assign(super.getExtraContext(props),{default_mobile:props.selectedConversation.numberFormat,default_phone:props.selectedConversation.numberFormat,default_name:props.selectedConversation.name,default_user_id:this.env.services.user.userId,})}
async onSave(record){await super.onSave(record)
if(record.resId!==this.props.selectedConversation.partner.id){await this.savePartner([record.resId,record.data.display_name])}}}
PartnerForm.props=Object.assign({},PartnerForm.props)
PartnerForm.defaultProps=Object.assign({},PartnerForm.defaultProps)
patch(PartnerForm.props,{selectedConversation:{type:ConversationModel.prototype},viewModel:{type:String,optional:true},viewType:{type:String,optional:true},viewKey:{type:String,optional:true},})
patch(PartnerForm.defaultProps,{viewModel:'res.partner',viewType:'form',viewKey:'partner_form',})
return __exports;});;
odoo.define('@a0ab5b871d0b9b4e8f7af01774f6c90121c5c8605b6df6e2afa06745132533d4',['@odoo/owl'],function(require){'use strict';let __exports={};const{Component,useState,useRef}=require('@odoo/owl')
const AudioPlayer=__exports.AudioPlayer=class AudioPlayer extends Component{setup(){super.setup()
this.state=useState({time:'',show:false,error:null,paused:true})
this.audioRef=useRef('audioRef')
this.playbackRef=useRef('playbackRef')
this.progressRef=useRef('progressRef')
this.ignoreTimeUpdateEvent=false}
onLoadData(event){const audio=event.target
this.state.time=this.calculateTime(this.props.duration||audio.duration)
this.state.show=true}
onError(){this.state.error=true
this.state.show=true}
onTimeUpdate(event){const audio=event.target
let percentage=audio.currentTime*100.00/(this.props.duration||audio.duration)
percentage=Math.round(percentage)
this.playbackRef.el.style.width=`${percentage}%`
if(!this.ignoreTimeUpdateEvent){this.state.time=this.calculateTime(audio.currentTime)}}
onEnded(event){this.ignoreTimeUpdateEvent=true
const audio=event.target
audio.currentTime=0
this.state.paused=true
this.state.time=this.calculateTime(this.props.duration||audio.duration)}
onPlayPause(event){event.preventDefault();this.ignoreTimeUpdateEvent=false
if(this.state.paused){this.audioRef.el.play()}else{this.audioRef.el.pause()}
this.state.paused=!this.state.paused}
changeProgress(event){this.ignoreTimeUpdateEvent=false
let relative_position,percentage
const position=this.progressRef.el.getBoundingClientRect()
relative_position=event.pageX-position.left
percentage=relative_position/position.width
if(Number.isFinite(this.props.duration||this.audioRef.el.duration)){this.audioRef.el.currentTime=(this.props.duration||this.audioRef.el.duration)*percentage}}
calculateTime(num){let out=''
if(!isNaN(num)&&Number.isFinite(num)){let zero=(x)=>x<10?'0'+x:x;let minutes=Math.floor(num/60.0);let seconds=Math.round(num)%60;let hours=Math.floor(minutes/60.0);minutes=Math.round(minutes)%60;if(hours){out=zero(hours)+":";}
out+=zero(minutes)+":"+zero(seconds);}
return out;}
onDownload(){if(this.props.audio.src){const link=document.createElement('a')
if(this.props.audio.src.startsWith('blob:')){link.href=this.props.audio.src
link.download='audio.oga'}else{if(this.props.audio.src.startsWith('/web/content/')){const split=this.props.audio.src.split('/')
const attachId=split[split.length-1]
link.href=`/web/content/ir.attachment/${attachId}/datas?download=true`}else{link.href=this.props.audio.src}
link.download=''}
link.click()}}}
Object.assign(AudioPlayer,{template:'chatroom.AudioPlayer',props:{audio:Object,duration:{type:Number,optional:true,}},})
return __exports;});;
odoo.define('@b776165a95553fcc22eda64dc09cd1e02d2db4727ab51cf648290a373a0251c6',['@odoo/owl'],function(require){'use strict';let __exports={};const{Component,useRef}=require('@odoo/owl')
const ChatSearch=__exports.ChatSearch=class ChatSearch extends Component{setup(){super.setup()
this.env;this.props;this.inputSearch=useRef('inputSearch')}
onKeypress(event){if(event.which===13){this.env.chatBus.trigger(this.props.searchEvent,{search:this.inputSearch.el.value})}}
onSearch(){this.env.chatBus.trigger(this.props.searchEvent,{search:this.inputSearch.el.value})}
onClean(){this.inputSearch.el.value=''
this.env.chatBus.trigger(this.props.cleanEvent||this.props.searchEvent,{search:''})}}
Object.assign(ChatSearch,{template:'chatroom.ChatSearch',props:{placeHolder:{type:String,optional:true},cleanEvent:{type:String,optional:true},searchEvent:String,slots:{type:Object,optional:true},},defaultProps:{placeHolder:'',}})
return __exports;});;
odoo.define('@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6',['@web/core/l10n/translation','@web/core/utils/draggable','@web/core/errors/error_dialogs','@web/core/ui/ui_service','@web/core/utils/urls','@web/core/browser/browser','@odoo/owl','@web/core/utils/hooks','@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59','@222f8128b2dad460c0c9e2fb21a1f67a899c54f034d6e8fa2b79a3f441e55202','@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7','@beeaf954ff9ccf25f357f70e74c5694ebdfbd24b19c687bd9a0808adec370c9f','@717da89923407d2bbdeadd4f99b9e8918889493cac89cdeb293e1e42f46b02fa','@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b','@c011635ccdcd3301f40c07724a28d782d0f498e544a6747890cf878476644d9c','@5a3fee26d6d9d1773c181ece51534258527ca03ba61426578e02cb70bb082bde','@cd65c2f7c5d51e3e81e9b811a04746bc25792e024637521e55c8fa666024b743','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef','@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1','@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{useDraggable}=require('@web/core/utils/draggable')
const{WarningDialog}=require('@web/core/errors/error_dialogs')
const{SIZES}=require('@web/core/ui/ui_service')
const{url}=require('@web/core/utils/urls')
const{browser}=require('@web/core/browser/browser')
const{Component,EventBus,useSubEnv,useState,onWillStart,useRef}=require('@odoo/owl')
const{useBus}=require('@web/core/utils/hooks')
const{ChatroomHeader}=require('@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59')
const{ConversationList}=require('@222f8128b2dad460c0c9e2fb21a1f67a899c54f034d6e8fa2b79a3f441e55202')
const{Conversation}=require('@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7')
const{ConversationHeader}=require('@beeaf954ff9ccf25f357f70e74c5694ebdfbd24b19c687bd9a0808adec370c9f')
const{ConversationThread}=require('@717da89923407d2bbdeadd4f99b9e8918889493cac89cdeb293e1e42f46b02fa')
const{TabsContainer}=require('@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b')
const{Toolbox}=require('@c011635ccdcd3301f40c07724a28d782d0f498e544a6747890cf878476644d9c')
const{ConversationName}=require('@5a3fee26d6d9d1773c181ece51534258527ca03ba61426578e02cb70bb082bde')
const{LoadingIndicator}=require('@cd65c2f7c5d51e3e81e9b811a04746bc25792e024637521e55c8fa666024b743')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{DefaultAnswerModel}=require('@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1')
const{UserModel}=require('@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a')
const Chatroom=__exports.Chatroom=class Chatroom extends Component{setup(){super.setup()
this.env;this.state=useState(this.getInitState())
this.currencyId=null
this.defaultAnswers={}
this.canPlay=typeof(Audio)!=='undefined'
this.audio=null
this.myController=null
this.chatroomRef=useRef('chatroomRef')
this.firstSideRef=useRef('firstSideRef')
this.middleSideRef=useRef('middleSideRef')
this.showUserInMessage=false
this.canTranscribe=false
this.canTranslate=false
this.currentLang=false
this.iAmAdmin=false
this.chatroomTabSize=this.state.chatroomTabSize
useSubEnv(this.getSubEnv())
this.productDragAndDrop()
useBus(this.env.chatBus,'selectConversation',this.selectConversation.bind(this))
useBus(this.env.chatBus,'deleteConversation',this.deleteConversation.bind(this))
useBus(this.env.chatBus,'mobileNavigate',this.mobileNavigate.bind(this))
useBus(this.env.chatBus,'selectTab',this.updateTab.bind(this))
useBus(this.env.services.bus_service,'notification',this.onNotification.bind(this))
useBus(this.env.services.ui.bus,'resize',this.resize.bind(this))
useBus(document,'visibilitychange',this.visibilityChange)
onWillStart(this.willStart.bind(this))
const updateMyController=()=>{this.myController=this.env.services.action.currentController
this.state.renderForms=true
this.env.bus.removeEventListener('ACTION_MANAGER:UI-UPDATED',updateMyController)}
this.env.bus.addEventListener('ACTION_MANAGER:UI-UPDATED',updateMyController)}
getInitState(){const chatroomTabSize=parseInt(browser.localStorage.getItem('chatroomTabSize')||'0')
return{user:new UserModel(this),selectedConversation:null,conversations:[],currentMobileSide:'',renderForms:false,chatroomTabSize,tabSelected:this.props.tabSelected||'tab_default_answer',}}
getSubEnv(){return{context:this.props.action.context,chatBus:new EventBus(),chatModel:'acrux.chat.conversation',getCurrency:()=>this.currencyId,chatroomJsId:this.props.action.jsId,getShowUser:()=>this.showUserInMessage,canTranscribe:()=>this.canTranscribe,canTranslate:()=>this.canTranslate,getCurrentLang:()=>this.currentLang,isVerticalView:()=>this.state.user?.tabOrientation==='vertical',isAdmin:()=>this.isAdmin,}}
async willStart(){this.currencyId=await this.getCurrency()
this.defaultAnswers=await this.getDefaultAnswers()
this.conversationUsedFields=await this.getConversationUsedFields()
this.conversationInfoForm=await this.getConversationInfoView()
this.conversationKanban=await this.getConversationKanbanView()
this.aiIntefaceForm=await this.getAiIntefaceView()
this.state.user.updateFromJson(await this.getUserPreference())
this.showUserInMessage=await this.env.services.user.hasGroup('whatsapp_connector.group_chat_show_user_in_message')
this.isAdmin=await this.env.services.user.hasGroup('whatsapp_connector.group_chatroom_admin')
this.canTranscribe=await this.getTranscriptionModel()
this.canTranslate=await this.getTranslationModel()
await this.setServerConversation()
if(this.canPlay){this.audio=new Audio()
if(this.audio.canPlayType('audio/ogg; codecs=vorbis')){this.audio.src=url('/mail/static/src/audio/ting.ogg')}else{this.audio.src=url('/mail/static/src/audio/ting.mp3')}}
if(this.props.selectedConversationId){const conv=this.state.conversations.find(conv=>conv.id===this.props.selectedConversationId)
if(conv){this.selectConversation({detail:{conv}})}else{this.selectConversation({detail:{conv:null}})}}else{this.selectConversation({detail:{conv:null}})}}
async setServerConversation(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'search_active_conversation',[],{context:this.env.context})
await this.upsertConversation(data)
return this.state.conversations}
async getCurrency(){const{orm}=this.env.services
const currency=await orm.read('res.company',[this.env.services.company.currentCompany.id],['currency_id'],{context:this.env.context})
return currency[0].currency_id[0]}
async getDefaultAnswers(){const{orm}=this.env.services
const data=await orm.call('acrux.chat.default.answer','get_for_chatroom',[],{context:this.env.context})
const defaultAnswers={}
defaultAnswers[-1]=[]
for(const answer of data){const connector_id=answer.connector_id&&answer.connector_id[0]||-1
if(!(connector_id in defaultAnswers)){defaultAnswers[connector_id]=[]}
defaultAnswers[connector_id].push(new DefaultAnswerModel(this,answer))}
for(const key of Object.keys(defaultAnswers)){if(key!=='-1'){defaultAnswers[key]=[...defaultAnswers[-1],...defaultAnswers[key]]
defaultAnswers[key].sort((a,b)=>a.sequence-b.sequence)}}
return defaultAnswers}
async getConversationInfoView(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'check_object_reference',['','view_whatsapp_connector_conversation_chatroom_form'],{context:this.context})
return data[1]}
async getConversationKanbanView(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'check_object_reference',['','view_whatsapp_connector_conversation_kanban'],{context:this.context})
return data[1]}
async getAiIntefaceView(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'check_object_reference',['','view_whatsapp_connector_ai_interface_form'],{context:this.context})
return data[1]}
async getTranscriptionModel(){const{orm}=this.env.services
const data=await orm.searchRead('acrux.chat.ai.config',[['operation_key','=','audio_transcriptions']],['name'],{context:this.context,limit:1})
return data.length?data[0].id:0}
async getTranslationModel(){let out=0
const{orm}=this.env.services
const transalateRef=await orm.call(this.env.chatModel,'check_object_reference',['','data_ai_translate'],{context:this.context})
if(transalateRef?.length&&transalateRef[1]){const translateModel=await orm.read('acrux.chat.ai.config',[transalateRef[1]],['name','active'],{context:this.context})
if(translateModel?.length){if(translateModel[0].active){out=translateModel[0].id}}}
return out}
async getConversationUsedFields(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'get_fields_to_read',[],{context:this.env.context})
return data}
get userPreferenceFild(){return['id','chatroom_signing_active','acrux_chat_active']}
async getUserPreference(){const data=await this.env.services.orm.read('res.users',[this.env.services.user.userId],this.userPreferenceFild,{context:this.env.context})
const params=await this.env.services.orm.call(this.env.chatModel,'get_config_parameters',[],{context:this.env.context})
Object.assign(data[0],params)
return data[0]}
async upsertConversation(convList){const conversations=[...this.state.conversations]
const out=[]
let replaceSelectedConversation=false
if(convList){if(!Array.isArray(convList)){convList=[convList]}
for(const convData of convList){let conv=conversations.find(conv=>conv.id===convData.id)
if(conv){if(this.state.selectedConversation?.id===convData.id){replaceSelectedConversation=true}
conv.updateFromJson(convData)
await conv.buildExtraObj()}else{conv=new ConversationModel(this,convData)
await conv.buildExtraObj()
conversations.push(conv)}
out.push(conv)}}
const canHaveThisConversationProm=await Promise.all(conversations.map(conv=>this.canHaveThisConversation(conv)))
this.state.conversations=conversations.filter((_conv,index)=>canHaveThisConversationProm[index])
if(replaceSelectedConversation){const index=this.state.conversations.findIndex(conv=>conv.id===this.state.selectedConversation?.id)
if(index>=0){this.env.chatBus.trigger('updateConversation',{conv:this.state.conversations[index]})}else{this.env.chatBus.trigger('selectConversation',{conv:null})}}
return out.filter(item=>this.state.conversations.includes(item))}
async canHaveThisConversation(conversation){let out=true
if(this.isAdmin){out=conversation.status!=='done'}else{out=conversation.status==='new'||conversation.isCurrent()}
return out}
async selectConversation({detail:{conv}}){this.state.selectedConversation=conv
if(this.myController){this.myController.props.selectedConversationId=conv?conv.id:undefined}
if(conv){await conv.selected()
this.env.chatBus.trigger('mobileNavigate','middleSide')}}
async onNotification({detail:notifications}){if(notifications){const proms=notifications.map(d=>this.notifactionProcessor(d))
await Promise.all(proms)}}
async notifactionProcessor(data){const proms=[]
if(data.type==='new_messages'&&this.state.user.status){proms.push(...data.payload.map(m=>this.onNewMessage(m)))}
if(data.type==='init_conversation'&&this.state.user.status){proms.push(...data.payload.map(m=>this.onInitConversation(m)))}
if(data.type==='change_status'){proms.push(...data.payload.map(m=>this.onChangeStatus(m)))}
if(data.type==='update_conversation'&&this.state.user.status){proms.push(...data.payload.map(m=>this.onUpdateConversation(m)))}
if(data.type==='error_messages'&&this.state.user.status){proms.push(...data.payload.map(m=>this.onErrorMessages(m)))}
await Promise.all(proms)}
async onNewMessage(convData){const{desk_notify,messages}=convData
const someMessageNew=messages.some(msg=>!msg.from_me)
let conv=null
const res=await this.upsertConversation(convData)
if(res.length>0){conv=res[0]
if(document.hidden){if('all'&&desk_notify||('mines'===desk_notify&&conv.agent.id===this.env.services.user.userId)){if(someMessageNew){const msg=_t('New messages from ')+conv.name
this.env.services.notification.add(msg,{type:'info'})
await this.playNotification()}}}else{if(someMessageNew&&this.state.selectedConversation?.id===conv.id&&conv.isCurrent()){await conv.messageSeen()}}}
return conv}
async onUpdateConversation(convData){await this.upsertConversation(convData)
return this.state.conversations.find(x=>x.id===convData.id)}
async onInitConversation(convData){await this.upsertConversation(convData)
const conv=this.state.conversations.find(x=>x.id===convData.id)
if(conv){this.env.chatBus.trigger('selectConversation',{conv})}
return conv}
async onChangeStatus(data){if(data.agent_id[0]===this.env.services.user.userId){if(this.state.user.status!==data.status){this.state.user.status=data.status
this.changeStatusView(data)}
if(this.state.user.signingActive!==data.signing_active){this.state.user.signingActive=data.signing_active}}}
async onErrorMessages(convData){const conv=this.state.conversations.find(x=>x.id===convData.id)
if(conv){conv.updateFromJson(convData)
await conv.buildExtraObj()
const messageIds=convData.messages.map(msg=>msg.id)
const message=conv.messages.find(msg=>messageIds.includes(msg.id))
this.env.services.dialog.add(WarningDialog,{message:_t('Error in conversation with ')+conv.name},{onClose:async()=>{if(this.state.selectedConversation===conv){if(message){this.env.chatBus.trigger('inmediateScrollToMessage',{message})}}else{if(message){this.env.chatBus.trigger('scrollToMessage',{message})}
this.env.chatBus.trigger('selectConversation',{conv})}}})}}
async deleteConversation({detail:{id}}){const conv=this.state.conversations.find(x=>x.id===id)
this.state.conversations=this.state.conversations.filter(x=>x.id!==id)
if(conv){if(conv===this.state.selectedConversation){this.env.chatBus.trigger('selectConversation',{conv:null})
this.env.chatBus.trigger('mobileNavigate','firstSide')}}
return Promise.resolve(conv)}
productDragAndDrop(){useDraggable({enable:true,ref:this.chatroomRef,elements:'.acrux_Product',cursor:'grabbing',onDragStart:()=>this.env.chatBus.trigger('productDragInit'),onDragEnd:()=>this.env.chatBus.trigger('productDragEnd'),onDrag:({x,y})=>this.env.chatBus.trigger('productDragging',{x,y}),onDrop:({x,y,element})=>{const product={id:element.dataset.id,name:element.dataset.name}
this.env.chatBus.trigger('productDrop',{x,y,product})},})}
visibilityChange(){if(!document.hidden&&this.state.selectedConversation&&this.state.selectedConversation.isCurrent()){this.state.selectedConversation.messageSeen()}}
mobileNavigate({detail:target}){if(this.env.services.ui.size<=SIZES.MD){this.state.currentMobileSide=target}}
get firtSideMobile(){let out=''
if(this.env.services.ui.size<=SIZES.MD){const{currentMobileSide}=this.state
if(currentMobileSide==='firstSide'){}else if(currentMobileSide==='middleSide'){if(this.env.services.ui.size<SIZES.MD){out='d-none'}}else if(currentMobileSide==='lastSide'){out='d-none'}}
return out}
get middleSideMobile(){let out=''
if(this.env.services.ui.size<=SIZES.MD){const{currentMobileSide}=this.state
if(currentMobileSide==='firstSide'){if(this.env.services.ui.size<SIZES.MD){out='d-none'}}else if(currentMobileSide==='middleSide'){}else if(currentMobileSide==='lastSide'){out='d-none'}}
return out}
get lastSideMobile(){let out=''
if(this.env.services.ui.size<=SIZES.MD){const{currentMobileSide}=this.state
if(currentMobileSide==='firstSide'){out='d-none'}else if(currentMobileSide==='middleSide'){out='d-none'}else if(currentMobileSide==='lastSide'){out='col-12'}}
return out}
resize(){this.state.currentMobileSide=''
this.chatroomTabSize=this.state.chatroomTabSize}
async playNotification(){if(this.canPlay){try{await this.audio.play()}catch{}}}
updateTab({detail:tabId}){if(this.myController){this.myController.props.tabSelected=tabId}
this.state.tabSelected=tabId}
changeTabSize(event){const target=event.currentTarget||event.target
const reducing=target.className.includes('left')
const size=this.state.chatroomTabSize+(reducing?-2:2)
this.chatroomTabSize=size}
set chatroomTabSize(size){size=Math.max(-2,size)
size=Math.min(2,size)
browser.localStorage.setItem('chatroomTabSize',size)
this.state.chatroomTabSize=size}
get chatroomTabSize(){return this.state.chatroomTabSize}}
Object.assign(Chatroom,{props:{action:Object,actionId:{type:Number,optional:true},className:String,globalState:{type:Object,optional:true},selectedConversationId:{type:Number,optional:true},tabSelected:{type:String,optional:true}},components:{ChatroomHeader,Conversation,ConversationHeader,ConversationThread,TabsContainer,Toolbox,ConversationName,ConversationList,LoadingIndicator,},template:'chatroom.Chatroom',})
return __exports;});;
odoo.define('@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59',['@odoo/owl'],function(require){'use strict';let __exports={};const{Component}=require('@odoo/owl')
const ChatroomHeader=__exports.ChatroomHeader=class ChatroomHeader extends Component{setup(){super.setup()}}
Object.assign(ChatroomHeader,{template:'chatroom.ChatroomHeader',props:{slots:Object,className:{type:String,optional:true}},defaultProps:{className:''}})
return __exports;});;
odoo.define('@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7',['@web/session','@odoo/owl','@mail/core/common/relative_time','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{session}=require('@web/session')
const{Component}=require('@odoo/owl')
const{RelativeTime}=require('@mail/core/common/relative_time')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const Conversation=__exports.Conversation=class Conversation extends Component{setup(){super.setup()
this.env
this.props}
onSelect(){this.env.chatBus.trigger(this.props.selectTrigger,{conv:this.props.conversation})}
async onClose(event){event.stopPropagation()
if(session.chatroom_release_conv_on_close){await this.props.conversation.close()}
this.env.chatBus.trigger(this.props.deleteTrigger,this.props.conversation)}
get isSelected(){const{selectedConversation,conversation}=this.props
return(conversation.id===selectedConversation?.id)}}
Object.assign(Conversation,{template:'chatroom.Conversation',props:{conversation:ConversationModel.prototype,selectedConversation:{type:ConversationModel.prototype,optional:true},hideClose:{type:Boolean,optional:true},selectTrigger:{type:String,optional:true},deleteTrigger:{type:String,optional:true},},defaultProps:{hideClose:false,selectTrigger:'selectConversation',deleteTrigger:'deleteConversation',},components:{RelativeTime,}})
return __exports;});;
odoo.define('@0834dd1040d7a3b188437dce6ad6f011757b7e8b052b9d8ccdeab7e03abe8763',['@odoo/owl','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{Component}=require('@odoo/owl')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const ConversationCard=__exports.ConversationCard=class ConversationCard extends Component{setup(){super.setup()
this.env;}
onClick(){this.env.chatBus.trigger(this.props.selectTrigger,this.props.conversation)}}
Object.assign(ConversationCard,{template:'chatroom.ConversationCard',props:{conversation:ConversationModel.prototype,className:{type:String,optional:true},selectTrigger:{type:String,optional:true},},defaultProps:{className:'',selectTrigger:'initAndNotifyConversation',},components:{}})
return __exports;});;
odoo.define('@beeaf954ff9ccf25f357f70e74c5694ebdfbd24b19c687bd9a0808adec370c9f',['@odoo/owl','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef','@5a3fee26d6d9d1773c181ece51534258527ca03ba61426578e02cb70bb082bde'],function(require){'use strict';let __exports={};const{Component}=require('@odoo/owl')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{ConversationName}=require('@5a3fee26d6d9d1773c181ece51534258527ca03ba61426578e02cb70bb082bde')
const ConversationHeader=__exports.ConversationHeader=class ConversationHeader extends Component{setup(){super.setup()
this.env
this.props}}
Object.assign(ConversationHeader,{template:'chatroom.ConversationHeader',props:{selectedConversation:ConversationModel.prototype,},components:{ConversationName}})
return __exports;});;
odoo.define('@5a3fee26d6d9d1773c181ece51534258527ca03ba61426578e02cb70bb082bde',['@odoo/owl','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{Component}=require('@odoo/owl')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const ConversationName=__exports.ConversationName=class ConversationName extends Component{setup(){super.setup()
this.env
this.props}}
Object.assign(ConversationName,{template:'chatroom.ConversationName',props:{selectedConversation:ConversationModel.prototype,},})
return __exports;});;
odoo.define('@717da89923407d2bbdeadd4f99b9e8918889493cac89cdeb293e1e42f46b02fa',['@odoo/owl','@web/core/utils/hooks','@cd88eb6ddbd39307a4d8acd1cff882374d40d987a801fff227eb08b73df94690','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{Component,useRef,onWillUpdateProps,onPatched,onMounted}=require('@odoo/owl')
const{useBus}=require('@web/core/utils/hooks')
const{Message}=require('@cd88eb6ddbd39307a4d8acd1cff882374d40d987a801fff227eb08b73df94690')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const ConversationThread=__exports.ConversationThread=class ConversationThread extends Component{setup(){super.setup()
this.env;this.props;this.threadRef=useRef('threadRef')
useBus(this.env.chatBus,'productDragInit',this.productDragInit.bind(this))
useBus(this.env.chatBus,'productDragging',this.productDragging.bind(this))
useBus(this.env.chatBus,'productDragEnd',this.productDragEnd.bind(this))
useBus(this.env.chatBus,'productDrop',this.productDrop.bind(this))
useBus(this.env.chatBus,'scrollToMessage',this.setMessageToScroll.bind(this))
useBus(this.env.chatBus,'inmediateScrollToMessage',this.scrollToMessage.bind(this))
this.firstScroll=true
this.loadMoreMessage=false
this.scrollToPrevMessage=null
this.messageToScroll=null
onWillUpdateProps(this.willUpdateProps.bind(this))
onMounted(this.checkScroll.bind(this))
onPatched(this.checkScroll.bind(this))}
async willUpdateProps(){this.loadMoreMessage=false
this.firstScroll=true
this.scrollToPrevMessage=null}
checkScroll(){if(this.props.selectedConversation){if(this.messageToScroll){this.scrollToMessage({message:this.messageToScroll})
this.messageToScroll=null}else if(this.scrollToPrevMessage){this.scrollToPrevMessage()
this.scrollToPrevMessage=null}else{if(this.needScroll()||this.firstScroll){this.scrollConversation()
this.firstScroll=false}}
this.loadMoreMessage=true}}
isInside(x,y){let out
const rect=this.threadRef.el.getBoundingClientRect()
if(rect.top<=y&&y<=rect.bottom){out=rect.left<=x&&x<=rect.right}else{out=false}
return out}
needScroll(){const scollPosition=this.calculateScrollPosition()
return scollPosition>=0.7}
calculateScrollPosition(){let scrollPosition=0
if(this.threadRef.el){const scrollTop=this.threadRef.el.scrollTop
const scrollHeight=this.threadRef.el.scrollHeight
const clientHeight=this.threadRef.el.clientHeight
scrollPosition=(scrollTop+clientHeight)/scrollHeight}
return scrollPosition}
scrollConversation(){if(this.threadRef.el){const list=this.threadRef.el.querySelectorAll('.acrux_Message')
if(list.length){const lastMessage=list[list.length-1]
if(lastMessage){setTimeout(()=>lastMessage.scrollIntoView({block:'nearest',inline:'start'}),30)}}}}
scrollToMessage({detail:{message,effect,className}}){if(this.threadRef.el){const element=document.querySelector(`.acrux_Message[data-id="${message.id}"]`)
if(element){element.scrollIntoView({block:'nearest',inline:'start'})
if(effect==='blink'&&className){setTimeout(()=>element.classList.add('active_quote'),400)
setTimeout(()=>element.classList.remove('active_quote'),800)
setTimeout(()=>element.classList.add('active_quote'),1200)
setTimeout(()=>element.classList.remove('active_quote'),1600)}}}}
async syncMoreMessage(){if(this.props.selectedConversation&&this.loadMoreMessage&&this.threadRef.el&&this.threadRef.el.scrollTop===0){const message=this.threadRef.el.querySelector('.acrux_Message')
const size=this.props.selectedConversation.messages.length
await this.props.selectedConversation.syncMoreMessage()
if(message&&this.props.selectedConversation.messages.length>size){this.scrollToPrevMessage=()=>message.scrollIntoView()}}}
productDragInit(){this.threadRef.el.classList.add('drop-active')}
productDragging({detail:{x,y}}){if(this.isInside(x,y)){this.threadRef.el.classList.add('drop-hover')}else{this.threadRef.el.classList.remove('drop-hover')}}
productDragEnd(){this.threadRef.el.classList.remove('drop-active')
this.threadRef.el.classList.remove('drop-hover')}
async productDrop({detail:{x,y,product}}){if(this.isInside(x,y)&&this.props.selectedConversation?.isCurrent()){await this.props.selectedConversation.sendProduct(product.id)}}
setMessageToScroll({detail:{message}}){this.messageToScroll=message}}
Object.assign(ConversationThread,{template:'chatroom.ConversationThread',props:{selectedConversation:ConversationModel.prototype,},components:{Message}})
return __exports;});;
odoo.define('@222f8128b2dad460c0c9e2fb21a1f67a899c54f034d6e8fa2b79a3f441e55202',['@web/core/l10n/translation','@web/core/browser/browser','@web/core/transition','@odoo/owl','@web/core/utils/hooks','@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59','@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7','@b776165a95553fcc22eda64dc09cd1e02d2db4727ab51cf648290a373a0251c6','@0834dd1040d7a3b188437dce6ad6f011757b7e8b052b9d8ccdeab7e03abe8763','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{browser}=require('@web/core/browser/browser')
const{Transition}=require('@web/core/transition')
const{Component,useState,useEffect,useRef}=require('@odoo/owl')
const{useBus}=require('@web/core/utils/hooks')
const{ChatroomHeader}=require('@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59')
const{Conversation}=require('@0ac266676776f61364330bb041a16d836d8b315459e04c1a3381740f295958c7')
const{ChatSearch}=require('@b776165a95553fcc22eda64dc09cd1e02d2db4727ab51cf648290a373a0251c6')
const{ConversationCard}=require('@0834dd1040d7a3b188437dce6ad6f011757b7e8b052b9d8ccdeab7e03abe8763')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const ConversationList=__exports.ConversationList=class ConversationList extends Component{setup(){super.setup()
this.env;this.props
this.conversationFilterHolder=_t('Search')
this.state=useState(this.getInitState())
this.containerRef=useRef('containerRef')
useBus(this.env.chatBus,'searchConversations',this.searchConversations.bind(this))
useBus(this.env.chatBus,'cleanSearch',this.closeFilter.bind(this))
useBus(this.env.chatBus,'closeChatFilter',this.closeChatFilter.bind(this))
useBus(this.env.chatBus,'initAndNotifyConversation',this.initAndNotify.bind(this))
useBus(this.env.chatBus,'searchConversations',this.searchConversations.bind(this))
useEffect(()=>{this.filterAndOrderConversations()},()=>[this.props.conversations])}
getInitState(){const conversationOrder=browser.localStorage.getItem('chatroomConversationOrder')
return{conversations:[],isChatFiltering:false,chatFilterResponse:[],chatsFiltered:[],conversationOrder:conversationOrder&&JSON.parse(conversationOrder)||{current:'desc'},filterActivity:false,filterPending:false,filterMine:true,showWaitingHeader:false,modeSimple:false,countNewMsg:0,}}
getFilters(){return{filterActivity:this.state.filterActivity,filterPending:this.state.filterPending,filterMine:this.state.filterMine,}}
changeViewMode(){if(this.state.modeSimple){this.containerRef.el.classList.remove('simple')}else{this.containerRef.el.classList.add('simple')}
this.state.modeSimple=!this.state.modeSimple}
onFilter(event){const target=event.currentTarget||event.target
if(target){const filter=target.getAttribute('filter-key')
this.state[filter]=!this.state[filter]
if(this.state.isChatFiltering){let chatsFiltered=this.state.chatFilterResponse.map(item=>{return{name:item.name,values:item.values.map(item2=>{return{name:item2.name,values:item2.values.filter(this.evaluateFilter.bind(this))}})}})
chatsFiltered=chatsFiltered.map(item=>{return{name:item.name,values:item.values.filter(item2=>item2.values.length>0)}})
chatsFiltered=chatsFiltered.filter(item=>item.values.length>0)
this.state.chatsFiltered=chatsFiltered}else{this.filterAndOrderConversations()}}}
onOrder(event){const target=event.currentTarget||event.target
if(target){const orderChange={desc:'lock_desc',lock_desc:'asc',asc:'lock_asc',lock_asc:'desc'}
const fildName='current'
this.state.conversationOrder[fildName]=orderChange[this.state.conversationOrder[fildName]]
browser.localStorage.setItem('chatroomConversationOrder',JSON.stringify(this.state.conversationOrder))
this.filterAndOrderConversations()}}
evaluateFilter(conv){let out=true
if(out&&this.state.filterPending){out=conv.countNewMsg>0}
if(out&&this.state.filterMine){out=conv.isMine()||['new'].includes(conv.status)}
if(out&&this.state.filterActivity){out=conv.oldesActivityDate&&conv.oldesActivityDate<luxon.DateTime.now()}
return out}
filterAndOrderConversations(){const conversations=this.props.conversations.filter(this.evaluateFilter.bind(this))
const order=this.state.conversationOrder
const orderFn=(a,b,criteria)=>{let out
if(criteria==='desc'){out=a.lastActivity<b.lastActivity}else{out=a.lastActivity>b.lastActivity}
return out?1:-1}
if(['asc','desc'].includes(order.current)){conversations.sort((a,b)=>orderFn(a,b,order.current))}
this.state.conversations=conversations
this.state.countNewMsg=conversations.filter(conv=>conv.countNewMsg>0).length}
getSortIcon(str){const orderIcon={desc:'fa-arrow-up',asc:'fa-arrow-down',lock_desc:'fa-lock',lock_asc:'fa-lock'}
return orderIcon[str]}
getSortTitle(str){const orderTitle={desc:_t('New Chats Up'),asc:_t('New Chats Down'),lock_desc:_t('Static Order'),lock_asc:_t('Static Order'),}
return orderTitle[str]}
async searchConversations({detail:{search}}){search=search.trim()
const result=await this.env.services.orm.call(this.env.chatModel,'conversation_filtering_js',[search,this.getFilters()],{context:this.env.context},)
const keys=Object.keys(result).filter(key=>result[key].length>0)
this.state.isChatFiltering=true
this.state.chatFilterResponse=keys.map(key=>{return{name:key,values:result[key].map(val=>{return{name:val.name,values:val.values.map(conv=>new ConversationModel(this,conv))}})}})
this.state.chatsFiltered=[...this.state.chatFilterResponse]}
closeFilter(){this.state.isChatFiltering=false
this.state.chatFilterResponse=[]
this.state.chatsFiltered=[]
this.filterAndOrderConversations()}
closeChatFilter(){this.state.isChatFiltering=false}
async initAndNotify({detail:{id}}){this.state.isChatFiltering=false
return this.env.services.orm.call(this.env.chatModel,'init_and_notify',[[id]],{context:this.env.context},)}
async createConversation(){const action={type:'ir.actions.act_window',name:_t('Create'),view_type:'form',view_mode:'form',res_model:this.env.chatModel,views:[[false,'form']],target:'new',context:{...this.env.context,chat_full_edit:true,default_is_odoo_created:true},}
const onSave=async record=>{if(record?.resId){await Promise.all([this.env.services.action.doAction({type:'ir.actions.act_window_close'}),Promise.resolve().then(()=>this.env.chatBus.trigger('initAndNotifyConversation',{id:record.resId})),Promise.resolve().then(()=>this.env.chatBus.trigger('closeChatFilter')),])}}
await this.env.services.action.doAction(action,{props:{onSave}})}
onToggleShowWaitingHeader(){this.state.showWaitingHeader=!this.state.showWaitingHeader}
get waintingConversations(){const current=new Set(this.currentConversations)
return this.state.conversations.filter(conv=>!current.has(conv))}
get currentConversations(){let out=[]
if(this.env.isAdmin()){out=this.state.conversations.filter(conv=>conv.status==='current')}else{out=this.state.conversations.filter(conv=>conv.isCurrent())}
return out}}
Object.assign(ConversationList,{props:{mobileNavigate:Function,conversations:{type:Array,element:{type:ConversationModel.prototype}},selectedConversation:{type:ConversationModel.prototype,optional:true},},components:{ChatroomHeader,Conversation,ChatSearch,ConversationCard,Transition,},template:'chatroom.ConversationList',})
return __exports;});;
odoo.define('@db85d529c7bfe389fdf15fba7fac9a7ed7d8b33a6bae85cb02ff638f64b2630d',['@web/core/l10n/translation','@web/core/errors/error_dialogs','@odoo/owl','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef','@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{WarningDialog}=require('@web/core/errors/error_dialogs')
const{Component}=require('@odoo/owl')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{DefaultAnswerModel}=require('@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1')
const DefaultAnswer=__exports.DefaultAnswer=class DefaultAnswer extends Component{setup(){super.setup()
this.env
this.props}
async sendAnswer(event){let out=Promise.resolve()
if(event){event.target.disabled=true}
if(this.props.selectedConversation&&this.props.selectedConversation.isCurrent()){let text,ttype=this.props.defaultAnswer.ttype
if(ttype==='code'){ttype='text'
text=await this.env.services.orm.call('acrux.chat.default.answer','eval_answer',[[this.props.defaultAnswer.id],this.props.selectedConversation.id],{context:this.env.context})}else{if(this.props.defaultAnswer.text&&''!==this.props.defaultAnswer.text){text=this.props.defaultAnswer.text}else{text=this.props.defaultAnswer.name}}
const options={from_me:true,text:text,ttype:ttype,res_model:this.props.defaultAnswer.resModel,res_id:this.props.defaultAnswer.resId,button_ids:this.props.defaultAnswer.buttons.map(btn=>{const btn2={...btn}
delete btn2.id
return btn2}),chat_list_id:this.props.defaultAnswer.chatListRecord}
if(ttype==='text'&&text){this.env.chatBus.trigger('setInputText',text)}else{out=this.props.selectedConversation.createMessage(options)}}else{this.env.services.dialog.add(WarningDialog,{message:_t('You must select a conversation.')})}
return out.finally(()=>{if(event){event.target.disabled=false}})}}
Object.assign(DefaultAnswer,{template:'chatroom.DefaultAnswer',props:{selectedConversation:ConversationModel.prototype,defaultAnswer:DefaultAnswerModel.prototype,},})
return __exports;});;
odoo.define('@77841dc469b48ca608b4d7a840d74ad5a4605d44519882a2a029ac38f196c9ba',['@odoo/owl'],function(require){'use strict';let __exports={};const{Component}=require('@odoo/owl')
const Emojis=__exports.Emojis=class Emojis extends Component{setup(){super.setup()
this.env
this.data=['😁','😂','😃','😄','😅','😆','😇','😈','😉','😊','😋','😌','😍','😎','😏','😐','😑','😒','😓','😔','😕','😖','😗','😘','😙','😚','😛','😜','😝','😞','😟','😠','😡','😢','😣','😤','😥','😦','😧','😨','😩','😪','😫','😬','😭','😮','😯','😰','😱','😲','😳','😴','😵','😶','😷','😸','😹','😺','😻','😼','😽','😾','😿','🙀','🙁','🙂','🙃','🙄','🙅','🙆','🙇','🙈','🙉','🙊','🙋','🙌','🙍','🙎','🙏','👀','👁','👂','👃','👄','👅','👆','👇','👈','👉','👊','👋','👌','👍','👎','👏','👐','👦','👧','👨','👩','👪','👫','👬','👭','👺','👻','👼','👽','👾','👿','💀','💁','😀','❤️','💓','💔','💘','💩','💪','💵','🐞','🐻','🐌','🐗','🍀','🌹','🔥','☀️','⛅️','🌈','☁️','⚡️','⭐️','🍪','🍕','🍔','🍟','🎂','🍰','☕️','🍌','🍣','🍙','🍺','🍷','🍸','🍹','🍻','🎉','🏆','🔑','📌','📯','🎵','🎺','🎸','🏃','🚲','⚽️','🏈','🎱','🎬','🎤','🧀']}
onMouseLeave(){this.props.close()}}
Object.assign(Emojis,{template:'chatroom.Emojis',props:{close:Function,onClick:Function,}})
return __exports;});;
odoo.define('@cd65c2f7c5d51e3e81e9b811a04746bc25792e024637521e55c8fa666024b743',['@web/core/utils/hooks','@web/core/transition','@odoo/owl'],function(require){'use strict';let __exports={};const{useBus,useService}=require('@web/core/utils/hooks');const{Transition}=require('@web/core/transition');const{Component,useState}=require('@odoo/owl');const LoadingIndicator=__exports.LoadingIndicator=class LoadingIndicator extends Component{setup(){this.uiService=useService('ui');this.state=useState({show:false,})
let blockUITimer=null,shouldUnblock=false
useBus(this.env.chatBus,'block_ui',()=>{this.state.show=true
shouldUnblock=false
clearTimeout(blockUITimer)
blockUITimer=setTimeout(()=>{this.state.show=false
this.uiService.block()
shouldUnblock=true},3*1000)})
useBus(this.env.chatBus,'unblock_ui',()=>{clearTimeout(blockUITimer)
this.state.show=false
if(shouldUnblock){this.uiService.unblock()}})}}
LoadingIndicator.template='chatroom.LoadingIndicator'
LoadingIndicator.components={Transition}
LoadingIndicator.props={}
__exports[Symbol.for("default")]=LoadingIndicator
return __exports;});;
odoo.define('@cd88eb6ddbd39307a4d8acd1cff882374d40d987a801fff227eb08b73df94690',['@web/core/l10n/translation','@web/core/dialog/dialog','@web/views/fields/many2one_avatar/many2one_avatar_field','@odoo/owl','@ab7f5d9fd40e8af1794e1d4bda549e185b1adb30d52d425aee7a2d5297dae8ac','@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a','@a0ab5b871d0b9b4e8f7af01774f6c90121c5c8605b6df6e2afa06745132533d4','@c0e35d47c5c44a12e21a6d4f7b53b24ed5c4dfb95bc5c53e3d53f6a59d71a8d5','@f0d5ce8e258a89f4b99bc35f0feb3b8294bb58cf8e778353a87c58e35014d46c'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{Dialog}=require('@web/core/dialog/dialog')
const{Many2OneAvatarField}=require('@web/views/fields/many2one_avatar/many2one_avatar_field')
const{Component,xml,useRef}=require('@odoo/owl')
const{AttachmentList}=require('@ab7f5d9fd40e8af1794e1d4bda549e185b1adb30d52d425aee7a2d5297dae8ac')
const{MessageModel}=require('@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a')
const{AudioPlayer}=require('@a0ab5b871d0b9b4e8f7af01774f6c90121c5c8605b6df6e2afa06745132533d4')
const{MessageMetadata}=require('@c0e35d47c5c44a12e21a6d4f7b53b24ed5c4dfb95bc5c53e3d53f6a59d71a8d5')
const{MessageOptions}=require('@f0d5ce8e258a89f4b99bc35f0feb3b8294bb58cf8e778353a87c58e35014d46c')
const StoryDialog=__exports.StoryDialog=class StoryDialog extends Component{static template=xml`
<Dialog size="'lg'" fullscreen="true" bodyClass="'text-center'" title="props.title">
    <div href=""
        t-attf-style="background-image:url('{{props.url}}');width: auto;height: auto;"
        t-attf-data-mimetype="{{props.mime}}"
        class="o_Attachment_image o_image o-attachment-viewable o-details-overlay o-medium">
        <img t-attf-src="{{props.url}}" style="visibility: hidden;max-width: 100%; max-height: calc(100vh/1.5);" />
    </div>
</Dialog>`;static components={Dialog}
static props={close:{type:Function,optional:true},mime:String,url:String,title:String,}}
const Message=__exports.Message=class Message extends Component{setup(){super.setup()
this.env;this.props;this.optionsRef=useRef('optionsRef')}
messageCssClass(){const list=this.messageCssClassList()
if(this.props.message.dateDelete){list.push('o_chat_msg_deleted')}
return list.join(' ')}
messageCssClassList(){return[]}
async onTranscribe(){const{orm}=this.env.services
const data=await orm.call('acrux.chat.message','transcribe',[[this.props.message.id],this.env.canTranscribe()],{context:this.env.context})
this.props.message.transcription=data}
async onTranslate(){const{orm}=this.env.services
const lang=this.env.getCurrentLang()
const data=await orm.call('acrux.chat.message','translate',[[this.props.message.id],this.env.canTranslate(),lang],{context:this.env.context})
this.props.message.traduction=data}
get canTranslate(){return this.env.canTranslate()&&this.props.message.ttype!=='sticker'}
get avatarProps(){return{name:'createUid',relation:'res.users',string:_t('Agent'),readonly:true,record:{data:{createUid:[this.props.message.createUid.id,this.props.message.createUid.name]}}}}
openStoryImage(){const{mime,data}=this.props.message.resModelObj
const url=`data:${mime};base64,${data}`
this.env.services.dialog.add(StoryDialog,{url,mime,title:_t('Story')})}
async openOdooChat(){const threadService=await odoo.__WOWL_DEBUG__.root.env.services["mail.thread"]
threadService.openChat({userId:this.props.message.createUid.id})}
showMessageOption(){if(this.optionsPopoverCloseFn){this.optionsPopoverCloseFn()
this.optionsPopoverCloseFn=null}else{if(this.props.message.conversation?.isCurrent()){this.optionsPopoverCloseFn=this.env.services.popover.add(this.optionsRef.el,MessageOptions,{message:this.props.message,env:this.env,close:()=>{if(this.optionsPopoverCloseFn){this.optionsPopoverCloseFn()
this.optionsPopoverCloseFn=null}},},{position:'bottom',onClose:()=>this.optionsPopoverCloseFn=null},)}}}
clickQuoteMessage(ev){ev.stopPropagation()
const messages=this.props.message.conversation.messages
const quote=messages.find(msg=>msg.id===this.props.message.quote.id)
const data={message:quote?quote:messages[0]}
if(quote){data.effect='blink'
data.className='active_quote'}
this.env.chatBus.trigger('inmediateScrollToMessage',data)}}
Object.assign(Message,{template:'chatroom.Message',props:{message:MessageModel.prototype,noAction:{type:Boolean,optional:true},},defaultProps:{noAction:false,},components:{AttachmentList,AudioPlayer,MessageMetadata,Many2OneAvatarField,MessageOptions,Message,}})
return __exports;});;
odoo.define('@c0e35d47c5c44a12e21a6d4f7b53b24ed5c4dfb95bc5c53e3d53f6a59d71a8d5',['@odoo/owl','@a0ab5b871d0b9b4e8f7af01774f6c90121c5c8605b6df6e2afa06745132533d4'],function(require){'use strict';let __exports={};const{Component,onWillUpdateProps,onWillStart}=require('@odoo/owl')
const{AudioPlayer}=require('@a0ab5b871d0b9b4e8f7af01774f6c90121c5c8605b6df6e2afa06745132533d4')
const MessageMetadata=__exports.MessageMetadata=class MessageMetadata extends Component{setup(){super.setup()
this.env;this.props;this.data={}
onWillStart(this.willStart.bind(this))
onWillUpdateProps(this.willUpdateProps.bind(this))}
async willStart(){this.computeProps(this.props)}
async willUpdateProps(nextProps){this.computeProps(nextProps)}
computeProps(props){const data=JSON.parse(props.metadataJson)
data.title=data.title||''
data.body=data.body||''
this.data=data}
openExternalLink(){if(this.data.url){window.open(this.data.url,'_blank')}}
get audioObj(){return{src:this.data?.media?.url}}
get urlPreview(){return this.data?.media?.url}
get extraClass(){return''}}
Object.assign(MessageMetadata,{template:'chatroom.MessageMetadata',props:{type:String,metadataJson:String,},components:{AudioPlayer}})
return __exports;});;
odoo.define('@f0d5ce8e258a89f4b99bc35f0feb3b8294bb58cf8e778353a87c58e35014d46c',['@web/core/l10n/translation','@web/core/dialog/dialog','@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{Dialog}=require('@web/core/dialog/dialog')
const{MessageModel}=require('@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a')
const{Component}=owl
const{DateTime}=luxon
const MessageOptions=__exports.MessageOptions=class MessageOptions extends Component{setup(){super.setup()
this.env;this.props;}
answerMessage(){this.props.env.chatBus.trigger('quoteMessage',this.props.message)
this.props.close()}
deleteMessageDialog(){class DeleteDialog extends Component{deleteForMe(){this.props.deleteMessage(true)
this.props.close()}
deleteForAll(){this.props.deleteMessage(false)
this.props.close()}}
DeleteDialog.components={Dialog}
DeleteDialog.template='chatroom.DeleteMessage'
this.props.close()
const props={allowDeleteAll:this.getAllowDeleteAll(),deleteMessage:this.deleteMessage.bind(this),title:_t('Confirmation')}
this.env.services.dialog.add(DeleteDialog,props)}
getAllowDeleteAll(){let allowDeleteAll=true
if(this.props.message.fromMe){const now=DateTime.now()
const{days}=now.diff(this.props.message.dateMessage,'days').toObject()
const{minutes}=now.diff(this.props.message.dateMessage,'minutes').toObject()
if(Math.floor(days)>0){allowDeleteAll=false}else if(Math.floor(minutes)>59){allowDeleteAll=false}}else{allowDeleteAll=false}
return allowDeleteAll}
async deleteMessage(forMe){const msgData=await this.env.services.orm.call(this.props.env.chatModel,'delete_message',[[this.props.message.conversation.id],this.props.message.id,forMe],{context:this.props.env.context})
this.props.message.conversation.appendMessages(msgData)}}
Object.assign(MessageOptions,{template:'chatroom.MessageOptions',props:{message:MessageModel.prototype,close:Function,env:Object,},})
return __exports;});;
odoo.define('@7a62dfdb759d304a7edb10d42c865e22f111680eec0dd98093f1f375ab0785ab',['@odoo/owl','@web/views/fields/formatters','@a57f7a72eb29be2e68a9675edd680394d67e2ecd8df85dc2c38e83822c8551e8'],function(require){'use strict';let __exports={};const{Component}=require('@odoo/owl')
const{formatMonetary}=require('@web/views/fields/formatters')
const{ProductModel}=require('@a57f7a72eb29be2e68a9675edd680394d67e2ecd8df85dc2c38e83822c8551e8')
const Product=__exports.Product=class Product extends Component{setup(){super.setup()
this.env;}
formatPrice(price){return formatMonetary(price,{currencyId:this.env.getCurrency()})}
productOption(event){this.env.chatBus.trigger('productOption',{product:this.props.product,event})}}
Object.assign(Product,{template:'chatroom.Product',props:{product:ProductModel.prototype}})
return __exports;});;
odoo.define('@aedb85b64f8970ed4ccdcfb5fad7484eb5f9502792073b672b574c2d95ef5fe2',['@web/core/l10n/translation','@web/core/errors/error_dialogs','@odoo/owl','@web/core/utils/hooks','@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59','@b776165a95553fcc22eda64dc09cd1e02d2db4727ab51cf648290a373a0251c6','@7a62dfdb759d304a7edb10d42c865e22f111680eec0dd98093f1f375ab0785ab','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef','@a57f7a72eb29be2e68a9675edd680394d67e2ecd8df85dc2c38e83822c8551e8'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{WarningDialog}=require('@web/core/errors/error_dialogs')
const{Component,useState,onWillStart}=require('@odoo/owl')
const{useBus}=require('@web/core/utils/hooks')
const{ChatroomHeader}=require('@54b543691528c8f74a0ea8c47d8a8d71f5d481321088b43516787400b97b1a59')
const{ChatSearch}=require('@b776165a95553fcc22eda64dc09cd1e02d2db4727ab51cf648290a373a0251c6')
const{Product}=require('@7a62dfdb759d304a7edb10d42c865e22f111680eec0dd98093f1f375ab0785ab')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{ProductModel}=require('@a57f7a72eb29be2e68a9675edd680394d67e2ecd8df85dc2c38e83822c8551e8')
const ProductContainer=__exports.ProductContainer=class ProductContainer extends Component{setup(){super.setup()
this.env;this.state=useState({products:[]})
this.placeHolder=_t('Search')
useBus(this.env.chatBus,'productSearch',this.searchProduct)
useBus(this.env.chatBus,'productOption',this.productOption)
onWillStart(async()=>this.searchProduct({detail:{}}))}
async searchProduct({detail:{search}}){let val=search||''
const{orm}=this.env.services
const result=await orm.call(this.env.chatModel,'search_product',[val.trim()],{context:this.env.context})
this.state.products=result.map(product=>new ProductModel(this,product))}
async productOption({detail:{product,event}}){if(this.props.selectedConversation){if(this.props.selectedConversation.isCurrent()){await this.doProductOption({product,event})}else{this.env.services.dialog.add(WarningDialog,{message:_t('Yoy are not writing in this conversation.')})}}else{this.env.services.dialog.add(WarningDialog,{message:_t('You must select a conversation.')})}}
async doProductOption({product}){await this.props.selectedConversation.sendProduct(product.id)
this.env.chatBus.trigger('mobileNavigate','middleSide')}}
Object.assign(ProductContainer,{template:'chatroom.ProductContainer',props:{selectedConversation:ConversationModel.prototype,className:{type:String,optional:true}},defaultProps:{className:''},components:{ChatroomHeader,Product,ChatSearch,}})
return __exports;});;
odoo.define('@af0df1a5affde864bfaca0edba19137ac4e7199f2cb7ae310c45d7b47aaac68b',['@web/core/l10n/translation','@web/core/notebook/notebook','@odoo/owl','@acbad003049675bb72f8aa048c5505a3b1ff288c3fd1edf91e41bc101c8deb3e','@db85d529c7bfe389fdf15fba7fac9a7ed7d8b33a6bae85cb02ff638f64b2630d','@d3310142513a60875a36765d19fdb3dd7b162511bc1eeda32ca1cd870284e772','@6b827bd088194ec1bd28907241858b132687b2745bb08d69a01a07dbdc7f175f','@7c65d898248ee5e789e3fd3a146b2d7a8f1c704e8721e1d9782f3ea7abb93efc','@40aca894c21e4515549a3a5d23148601f5e3b684104bff0b1e4c01d5a8c39741','@30bcd30850cd19012d4f3f579cc45e01e3d534df66b8203139cb8a307d419749','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef','@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1','@aedb85b64f8970ed4ccdcfb5fad7484eb5f9502792073b672b574c2d95ef5fe2','@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{Notebook}=require('@web/core/notebook/notebook')
const{Component}=require('@odoo/owl')
const{NotebookChat}=require('@acbad003049675bb72f8aa048c5505a3b1ff288c3fd1edf91e41bc101c8deb3e')
const{DefaultAnswer}=require('@db85d529c7bfe389fdf15fba7fac9a7ed7d8b33a6bae85cb02ff638f64b2630d')
const{ConversationForm}=require('@d3310142513a60875a36765d19fdb3dd7b162511bc1eeda32ca1cd870284e772')
const{ConversationKanban}=require('@6b827bd088194ec1bd28907241858b132687b2745bb08d69a01a07dbdc7f175f')
const{ConversationPanelForm}=require('@7c65d898248ee5e789e3fd3a146b2d7a8f1c704e8721e1d9782f3ea7abb93efc')
const{AiIntefaceForm}=require('@40aca894c21e4515549a3a5d23148601f5e3b684104bff0b1e4c01d5a8c39741')
const{PartnerForm}=require('@30bcd30850cd19012d4f3f579cc45e01e3d534df66b8203139cb8a307d419749')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{DefaultAnswerModel}=require('@691be66bc681670fb0cd11c07adec04e8dfc38741d2ef37bf718faf4dab4f3b1')
const{ProductContainer}=require('@aedb85b64f8970ed4ccdcfb5fad7484eb5f9502792073b672b574c2d95ef5fe2')
const{UserModel}=require('@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a')
const TabsContainer=__exports.TabsContainer=class TabsContainer extends Component{setup(){super.setup()
this.env;this.props}
get tabPartnerFormProps(){return{viewTitle:_t('Partner'),viewResId:this.props.selectedConversation?.partner?.id,searchButton:true,searchButtonString:_t('Search Existing'),selectedConversation:this.props.selectedConversation,}}
get tabConversationFormProps(){return{viewId:this.props.conversationInfoForm,viewTitle:_t('Info'),viewResId:this.props.selectedConversation?.id,selectedConversation:this.props.selectedConversation,}}
get tabConversationKanbanProps(){return{viewId:this.props.conversationKanban,viewTitle:_t('Status'),formViewId:this.props.conversationInfoForm,selectedConversation:this.props.selectedConversation,}}
get tabConversationPanelFormProps(){return{viewId:this.props.conversationPanelForm,viewTitle:_t('Panel'),}}
get tabAiIntefaceFormProps(){return{viewId:this.props.aiIntefaceForm,viewTitle:_t('AI'),selectedConversation:this.props.selectedConversation,}}
get titles(){return{tab_default_answer:_t('Default Answers'),tab_partner:_t('Partner'),tab_init_conversation:_t('Conversations'),tab_product_grid:_t('Products'),tab_conv_info:_t('Info'),tab_conv_kanban:_t('Chat Funnels'),tab_conv_panel:_t('Activities'),tab_ai_inteface:_t('Artificial Intelligence'),}}
get comp(){return this.constructor.components}
get defaultAnswers(){const connectorId=this.props.selectedConversation?.connector?.id||-1
return this.props.defaultAnswers[connectorId]||this.props.defaultAnswers[-1]||[]}}
Object.assign(TabsContainer,{template:'chatroom.TabsContainer',props:{selectedConversation:ConversationModel.prototype,defaultAnswers:{type:Object,values:{type:Array,element:DefaultAnswerModel.prototype},},conversationUsedFields:{type:Array,element:String,},conversationInfoForm:{type:Number,optional:true},conversationKanban:{type:Number,optional:true},conversationPanelForm:{type:Number,optional:true},aiIntefaceForm:{type:Number,optional:true},className:{type:String,optional:true,},tabSelected:{type:String,optional:true},user:UserModel.prototype,},defaultProps:{className:''},components:{Notebook,NotebookChat,DefaultAnswer,PartnerForm,ConversationForm,ConversationKanban,ConversationPanelForm,AiIntefaceForm,ProductContainer,},})
return __exports;});;
odoo.define('@2e1f0fbcb1a82e655265881bfbf5c504fab7c1e51ea5c866d8fff94a38619126',['@mail/core/web/activity_button'],function(require){'use strict';let __exports={};const{ActivityButton:ActivityButtonBase}=require('@mail/core/web/activity_button')
const ActivityButton=__exports.ActivityButton=class ActivityButton extends ActivityButtonBase{setup(){super.setup()
this.env;}
get buttonClass(){let classes=super.buttonClass.split(' ')
classes=classes.filter(c=>c!==this.props.record.data.activity_type_icon)
classes=classes.filter(c=>!['text-dark','btn-link'].includes(c))
classes.push('fa-clock-o')
return classes.join(' ')}}
return __exports;});;
odoo.define('@c011635ccdcd3301f40c07724a28d782d0f498e544a6747890cf878476644d9c',['@web/core/browser/browser','@web/core/checkbox/checkbox','@web/core/utils/hooks','@web/core/transition','@web/core/select_menu/select_menu','@odoo/owl','@77841dc469b48ca608b4d7a840d74ad5a4605d44519882a2a029ac38f196c9ba','@2e1f0fbcb1a82e655265881bfbf5c504fab7c1e51ea5c866d8fff94a38619126','@3649d5fd8a43bbb30066c2e006f97400253ce22e14177253a704991fcd5fc224','@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef','@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a','@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a','@ab7f5d9fd40e8af1794e1d4bda549e185b1adb30d52d425aee7a2d5297dae8ac','@7786438cd71f02c0379165c08de97c669ab6ee7861ac0cfabdfc27ed36dc9c2f','@cd88eb6ddbd39307a4d8acd1cff882374d40d987a801fff227eb08b73df94690'],function(require){'use strict';let __exports={};const{browser}=require('@web/core/browser/browser')
const{CheckBox}=require('@web/core/checkbox/checkbox')
const{useAutofocus}=require('@web/core/utils/hooks')
const{Transition}=require('@web/core/transition')
const{SelectMenu}=require('@web/core/select_menu/select_menu')
const{Component,useRef,useState,useEffect,onWillStart,onWillUpdateProps}=require('@odoo/owl')
const{useBus}=require('@web/core/utils/hooks')
const{Emojis}=require('@77841dc469b48ca608b4d7a840d74ad5a4605d44519882a2a029ac38f196c9ba')
const{ActivityButton}=require('@2e1f0fbcb1a82e655265881bfbf5c504fab7c1e51ea5c866d8fff94a38619126')
const{useAttachmentUploader}=require('@3649d5fd8a43bbb30066c2e006f97400253ce22e14177253a704991fcd5fc224')
const{ConversationModel}=require('@e71c685495b3fd5a77d050fe9a0ee4564da20c118bd360ce54260886e1bb13ef')
const{MessageModel}=require('@7020aa6e3d62fd1ef5722ab7283652cd994893657d2f6d64c48687221ccf4d2a')
const{UserModel}=require('@6e344e9f6e92958c137d3f0fd12f4b185e994c729e92e763551752e4b953217a')
const{AttachmentList}=require('@ab7f5d9fd40e8af1794e1d4bda549e185b1adb30d52d425aee7a2d5297dae8ac')
const{FileUploader}=require('@7786438cd71f02c0379165c08de97c669ab6ee7861ac0cfabdfc27ed36dc9c2f')
const{Message}=require('@cd88eb6ddbd39307a4d8acd1cff882374d40d987a801fff227eb08b73df94690')
const Toolbox=__exports.Toolbox=class Toolbox extends Component{setup(){super.setup()
this.env
this.props
this.state=useState(this.getInitState())
this.attachmentUploader=useAttachmentUploader({onFileUploaded:this.onAddAttachment.bind(this),buildFormData:this.buildFormDataAttachment.bind(this),})
this.directUploader=useAttachmentUploader({buildFormData:this.buildFormDataDirectUpload.bind(this)})
this.langs={}
this.inputRef=useRef('inputRef')
this.emojisBtnRef=useRef('emojisBtnRef')
this.sendBtnRef=useRef('sendBtnRef')
this.inputLangRef=useRef('inputLangRef')
this.toolboxRef=useRef('toolboxRef')
this.allInputs=[this.inputRef,this.emojisBtnRef,this.inputLangRef]
this.wizardAction=null
useBus(this.env.chatBus,'setInputText',this.setInputText.bind(this))
useBus(this.env.chatBus,'quoteMessage',this.setQuoteMessage.bind(this))
useAutofocus('inputRef')
onWillStart(this.willStart.bind(this))
useEffect(this.enableDisplabeAttachBtn.bind(this),()=>[this.state.attachments])
onWillUpdateProps(async(props)=>{await this.updateLangs(props)
if(this.props?.selectedConversation!==props?.selectedConversation){this.env.chatBus.trigger('quoteMessage',null)}})}
getInitState(){return{attachments:[],showTraductor:browser.localStorage.getItem('chatroomShowTraductor')==='true',lang:undefined,message:null,}}
async willStart(){const{orm}=this.env.services
const data=await orm.call(this.env.chatModel,'check_object_reference',['','acrux_chat_message_wizard_action'],{context:this.context})
this.wizardAction=data[1]
await this.updateLangs(this.props)}
async updateLangs(props){if(props.selectedConversation?.allowedLangIds.length>0){const langIds=props.selectedConversation.allowedLangIds.filter(lang=>!this.langs[lang])
if(langIds.length>0){const allowedLangIds=await this.env.services.orm.call('res.lang','name_search',[],{args:[['id','in',langIds]],context:{...this.env.context,active_test:false},})
for(const lang of allowedLangIds){this.langs[lang[0]]=lang[1]}}
this.state.lang=props.selectedConversation.allowedLangIds[0]}else{this.state.lang=undefined}}
get conversationMine(){return this.props.selectedConversation?.isCurrent()?'':'d-none'}
get conversationNotMine(){return this.props.selectedConversation?.isCurrent()?'d-none':''}
get allowSign(){const{selectedConversation:conv}=this.props
return(conv?.isCurrent()&&conv.allowSigning?'':'d-none')}
get allowTranslate(){return this.canTranslate?'':'d-none'}
get hasManyLangs(){const{selectedConversation:conv}=this.props
return this.canTranslate&&conv.allowedLangIds.length>1?'':'d-none'}
get canTranslate(){const{selectedConversation:conv}=this.props
return!!conv?.allowedLangIds?.length&&this.env.canTranslate()}
get langProps(){const{allowedLangIds}=this.props?.selectedConversation||{allowedLangIds:[]}
const out={choices:allowedLangIds.map(value=>{return{value,label:this.langs[value]}}),required:true,searchable:true,onSelect:value=>{this.state.lang=value},value:this.state.lang,}
return out}
async blockClient(){if(this.props.selectedConversation){try{await this.props.selectedConversation.block()}catch(_e){}}}
async releaseClient(){if(this.props.selectedConversation?.isCurrent()){await this.props.selectedConversation.release()}}
async sendMessage(event){this.inputRef.el.disabled=true
this.sendBtnRef.el.disabled=true
if(this.inputLangRef.el){this.inputLangRef.el.disabled=true}
const outMessages=[]
let options={from_me:true},firstAttach
let text=this.inputRef.el.value.trim()
const attachments=[...this.state.attachments]
const attachmentsSent=[]
let traduction=''
if(this.state.lang&&this.env.canTranslate()&&this.inputLangRef.el){traduction=this.inputLangRef.el.value.trim()}
if(event){event.preventDefault()
event.stopPropagation()}
if(''!==traduction){options.traduction=traduction}
if(''!=text){options.ttype='text'
options.text=text}
if(attachments.length){firstAttach=attachments.shift()
options=this.setAttachmentValues2Message(options,firstAttach)}
try{this.env.chatBus.trigger('block_ui')
if(options.ttype){options=this.sendMessageHook(options)
outMessages.push(await this.props.selectedConversation.createMessage(options))
await this.postCreateMessage(outMessages[outMessages.length-1])
if(options.res_model==='ir.attachment'){attachmentsSent.push(options.res_model_obj)}
text=traduction=''
for await(const attachment of attachments){options=this.setAttachmentValues2Message({from_me:true},attachment)
options=this.sendMessageHook(options)
outMessages.push(await this.props.selectedConversation.createMessage(options))
await this.postCreateMessage(outMessages[outMessages.length-1])
attachmentsSent.push(attachment)}}}finally{this.inputRef.el.disabled=false
this.sendBtnRef.el.disabled=false
if(this.inputLangRef.el){this.inputLangRef.el.disabled=false}
this.state.attachments=[firstAttach,...attachments].filter(attach=>attach&&!attachmentsSent.includes(attach))
this.enableDisplabeAttachBtn()
this.env.chatBus.trigger('setInputText',[text,traduction])
this.env.chatBus.trigger('unblock_ui')}
return outMessages}
async postCreateMessage(){if(this.state.message){this.env.chatBus.trigger('quoteMessage',null)}}
setAttachmentValues2Message(options,attachment){if(attachment.mimetype.includes('image')){options.ttype='image'}else if(attachment.mimetype.includes('audio')){options.ttype='audio'}else if(attachment.mimetype.includes('video')){options.ttype='video'}else{options.ttype='file'}
options.res_model='ir.attachment'
options.res_id=attachment.id
options.res_model_obj=attachment
return options}
onAddAttachment(attachment){this.state.attachments=[...this.state.attachments,attachment]}
async unlinkAttachment(attachment){await this.attachmentUploader.unlink(attachment)
this.state.attachments=this.state.attachments.filter(e=>e.id!==attachment.id)}
buildFormDataAttachment(formData){formData.append('conversation_id',this.props.selectedConversation.id)
formData.append('connector_type',this.props.selectedConversation.connectorType)}
buildFormDataDirectUpload(){}
sendMessageHook(options){if(this.state.message){options.quote_id=this.state.message.exportToJson()}
return options}
onKeypress(event){if(event.which===13&&!event.shiftKey){event.preventDefault()
event.stopPropagation()
if(event.currentTarget.classList.contains('o_chat_toolbox_text_translated')){this.onTranslate().then(()=>this.inputRef.el.focus())}else{this.sendMessage()}}}
onKeydown(event){if(event.which===27){this.env.chatBus.trigger('quoteMessage',null)}}
onInput(event){const{target:textarea}=event
if(textarea.value.trim()){textarea.style.height='auto'
const newHeight=textarea.scrollHeight-(textarea.offsetHeight-textarea.clientHeight)
textarea.style.height=Math.min(newHeight,60)+'px';textarea.style.overflow=(newHeight>60)?'auto':'hidden'}else{textarea.style.removeProperty('height')
textarea.style.removeProperty('overflow')}}
async onPaste(event){let clipboardData=event.clipboardData||window.clipboardData
if(clipboardData){const files=[]
for(const item of clipboardData.items){if(item.kind==='file'){event.stopPropagation()
event.preventDefault()
files.push(item.getAsFile())}}
return Promise.all(files.map(file=>this.attachmentUploader.uploadFile(file))).catch(()=>{})}}
toggleEmojis(){if(this.popoverCloseFn){this.popoverCloseFn()
this.popoverCloseFn=null}else{this.popoverCloseFn=this.env.services.popover.add(this.emojisBtnRef.el,Emojis,{onClick:this.addEmojis.bind(this),close:()=>{if(this.popoverCloseFn){this.popoverCloseFn()
this.popoverCloseFn=null}}},{position:'top'})}}
addEmojis(event){const emoji=event.target.dataset.source
const startPos=this.inputRef.el.selectionStart;const endPos=this.inputRef.el.selectionEnd;const firstText=this.inputRef.el.value.substring(0,startPos)
const lastText=this.inputRef.el.value.substring(endPos,this.inputRef.el.value.length)
this.env.chatBus.trigger('setInputText',`${firstText}${emoji}${lastText}`)
this.inputRef.el.focus()
this.inputRef.el.selectionStart=startPos+emoji.length
this.inputRef.el.selectionEnd=startPos+emoji.length}
async updateSigning(newValue){await this.updateUserPreference({chatroom_signing_active:newValue})
this.props.user.signingActive=newValue}
async updateUserPreference(preference){await this.env.services.orm.write('res.users',[this.env.services.user.userId],preference,{context:this.env.context})}
needDisableInput(attachment){let out
if(this.props.selectedConversation?.isOwnerFacebook()){if(this.props.selectedConversation.isWabaExtern()){out=attachment.mimetype.includes('audio')}else{out=true}}else if(this.props.selectedConversation?.isWechat()){out=true}else{out=!(attachment.mimetype.includes('image')||attachment.mimetype.includes('video'))}
return out}
enableDisplabeAttachBtn(){if(this.state.attachments.length){const attachment=this.state.attachments[0]
if(this.needDisableInput(attachment)){this.env.chatBus.trigger('setInputText','')
this.allInputs.filter(e=>e.el).forEach(e=>e.el.disabled=true)
this.sendBtnRef.el.focus()}else{this.allInputs.filter(e=>e.el).forEach(e=>e.el.disabled=false)}
this.sendBtnRef.el.focus()}else{this.allInputs.filter(e=>e.el).forEach(e=>e.el.disabled=false)
this.inputRef.el.focus()}}
setInputText({detail}){const[text,traduction]=Array.isArray(detail)?detail:[detail]
if(!(this.inputRef.el.disabled||this.inputRef.el.readonly)){this.inputRef.el.value=text
this.onInput({target:this.inputRef.el})
if(this.inputLangRef.el){this.inputLangRef.el.value=traduction||''
this.onInput({target:this.inputLangRef.el})}}}
async setQuoteMessage({detail:message}){if(message){const data=message.exportToJson()
if(data.quote_id){delete(data.quote_id)}
if(data.metadata_type){delete(data.metadata_type)}
if(data.button_ids){delete(data.button_ids)}
const quote=new MessageModel(this.props.selectedConversation,data)
await quote.buildExtraObj()
this.state.message=quote
this.inputRef.el.focus()}else{this.state.message=null}}
async onTranslate(){const text=this.inputLangRef.el.value.trim()
const traduction=await this.doTranslate(text)
if(text&&traduction){this.env.chatBus.trigger('setInputText',[traduction,text])}}
async doTranslate(text){let traduction=null
if(text&&this.state.lang&&this.canTranslate){const lang_id=this.state.lang
const ai_config_id=this.env.canTranslate()
const conversation_id=this.props.selectedConversation.id
const{orm}=this.env.services
traduction=await orm.call('acrux.chat.message','translate_text',[ai_config_id,text,lang_id,conversation_id],{context:this.env.context})}
return traduction}
async sendWizard(){await this.env.services.action.doAction(this.wizardAction,{additionalContext:{default_conversation_id:this.props.selectedConversation.id,full_name:true,active_model:this.env.chatModel,}})}
openTab(ev){const target=ev.currentTarget||ev.target
if(target){const tabKey=target.getAttribute('tab-key')
this.env.chatBus.trigger('selectTab',tabKey)
this.env.chatBus.trigger('mobileNavigate','lastSide')}}
async delegateConversation(){const{orm}=this.env.services
await orm.call(this.env.chatModel,'delegate_conversation',[[this.props.selectedConversation.id]],{context:this.context})}
onToggleTraductor(){this.state.showTraductor=!this.state.showTraductor
browser.localStorage.setItem('chatroomShowTraductor',`${this.state.showTraductor}`)}}
Object.assign(Toolbox,{template:'chatroom.Toolbox',props:{user:UserModel.prototype,selectedConversation:ConversationModel.prototype,},components:{CheckBox,Emojis,AttachmentList,FileUploader,ActivityButton,Transition,SelectMenu,Message,}})
return __exports;});;
odoo.define('@5efd7dd7c2a6636c70a954ec5b0500a853c7d5fda021cab8b92fe1b4f9cea048',['@web/core/l10n/translation','@web/core/browser/browser','@web/core/registry','@web/core/utils/urls'],function(require){'use strict';let __exports={};const{_t}=require('@web/core/l10n/translation')
const{browser}=require('@web/core/browser/browser')
const{registry}=require('@web/core/registry')
const{url}=require('@web/core/utils/urls')
const chatroomNotificationService=__exports.chatroomNotificationService={dependencies:['action','bus_service','notification','user'],start(env,services){this.env=env
this.services=services
this.lastDialog=null
this.canPlay=typeof(Audio)!=='undefined'
if(this.canPlay){this.audio=new Audio()
if(this.audio.canPlayType('audio/ogg; codecs=vorbis')){this.audio.src=url('/mail/static/src/audio/ting.ogg')}else{this.audio.src=url('/mail/static/src/audio/ting.mp3')}}
this.notifactionsHash=new Map()
this.services.bus_service.addEventListener('notification',(notifications)=>{try{this.onNotifaction(notifications)}catch(e){console.error(e)}})
window.addEventListener('storage',this.onStorage.bind(this))
this.env.bus.addEventListener('last-dialog',({detail:lastDialog})=>{this.lastDialog=lastDialog})},onNotifaction({detail:notifications}){const data=notifications
if(data&&data.length){let json=JSON.stringify(data)
if(this.isChatroomTab()){browser.localStorage.setItem('chatroom_notification',json);}else{this.notifactionsHash.set(json,setTimeout(async()=>{await this.process(data)
this.notifactionsHash.delete(json)},50))}}},onStorage(event){if(event.key==='chatroom_notification'){const value=JSON.parse(event.newValue)
if(this.notifactionsHash.has(value)){clearTimeout(this.notifactionsHash.get(value))
this.notifactionsHash.delete(value)}}},isChatroomTab(){let out=false
const currentController=this.services.action.currentController
if(currentController){if(currentController.action.tag){out=currentController.action.tag==='acrux.chat.conversation_tag'}else{out=currentController?.props?.context?.is_acrux_chat_room}}
return out},async process(data){let msg=null
for await(const row of data){if(row.type==='new_messages'){msg=await this.processNewMessage({new_messages:row.payload})}else if(row.type==='opt_in'){await this.processOptIn({opt_in:row.payload})}else if(row.type==='error_messages'){await this.processErrorMessage({error_messages:row.payload})}}
if(msg){let message=_t('New Message from ')+msg.name
if(msg.messages&&msg.messages.length&&msg.messages[0].ttype=='text'){this.services.notification.add(msg.messages[0].text,{type:'info',title:message})}else{this.services.notification.add(message,{type:'info'})}
await this.playNotification()}},async processNewMessage(row){row.new_messages.forEach(conv=>{if(conv.messages){conv.messages=conv.messages.filter(msg=>!msg.from_me)}else{conv.messages=[]}})
let msg=row.new_messages.find(conv=>conv.desk_notify=='all'&&conv.messages.length)
if(!msg){msg=row.new_messages.find(conv=>conv.desk_notify=='mines'&&conv.agent_id&&conv.agent_id[0]==this.services.user.userId&&conv.messages.length)}
return msg},async processOptIn(row){const notify={type:row.opt_in.opt_in?'success':'warning',title:_t('Opt-in update'),sticky:true,}
const message=row.opt_in.name+' '+(row.opt_in.opt_in?_t('activate'):_t('deactivate'))+' opt-in.'
this.services.notification.add(message,notify)
if(this.services.action?.currentController){if(this.services.action.currentController.action.res_model==='acrux.chat.conversation'){await this.services.action.loadState()}
if(this?.lastDialog?.props?.actionProps?.resModel==='acrux.chat.message.wizard'){this.lastDialog.render(true)}}},async processErrorMessage(row){const msgList=[]
for(const conv of row.error_messages){for(const msg of conv.messages){if(msg.user_id[0]===this.services.user.userId){const newMsg=Object.assign({},msg)
newMsg.name=conv.name
newMsg.number=conv.number_format
msgList.push(newMsg)}}}
for(const msg of msgList){let complement=''
if(msg.text&&''!==msg.text){complement+=_t('. Message: ')+msg.text}
const notify={type:'danger',title:_t('Message with error in ')+`${msg.name} (${msg.number})`,sticky:true,}
const message=_t('Error: ')+msg.error_msg+complement
this.services.notification.add(message,notify)}
await this.playNotification()},async playNotification(){if(this.canPlay){try{await this.audio.play()}catch{}}},}
registry.category('services').add('chatroomNotification',chatroomNotificationService)
return __exports;});;
odoo.define('@50bd62c355a305e2bf67972dc3f4b202671c326267beab90445ecbd84862507a',['@web/core/registry','@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6'],function(require){'use strict';let __exports={};const{registry}=require('@web/core/registry')
const{Chatroom}=require('@42ffbf6224f23aacdf6b9a6289d4e396904ef6225cba7443d521319d2137e2b6')
registry.category('actions').add('acrux.chat.conversation_tag',Chatroom)
registry.category('actions').add('acrux.chat.null_action_tag',()=>{})
return __exports;});;
