# -*- coding: utf-8 -*-
import base64
import traceback
import json
import requests
from werkzeug.utils import secure_filename
from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from ..tools import date_delta_seconds
from ..tools import create_attachment_from_url

INSTAGRAM_AUDIO_FORMAT_ALLOWED = ['audio/x-wav', 'audio/mp4', 'audio/wav', 'audio/wave', 'audio/aac', 'audio/x-m4a',
                                  'audio/m4a']
INSTAGRAM_VIDEO_FORMAT_ALLOWED = ['video/x-msvideo', 'video/mp4', 'video/webm', 'video/quicktime', 'video/ogg',
                                  'video/avi']


class AcruxChatMessages(models.Model):
    _inherit = ['acrux.chat.base.message', 'acrux.chat.message.list.relation']
    _name = 'acrux.chat.message'
    _description = 'Chat Message'
    _order = 'date_message desc, id desc'

    name = fields.Char('name', compute='_compute_name', store=True)
    msgid = fields.Char('Message Id', copy=False)
    contact_id = fields.Many2one('acrux.chat.conversation', 'Contact',
                                 required=True, ondelete='cascade', index=True)
    connector_id = fields.Many2one('acrux.chat.connector', related='contact_id.connector_id',
                                   string='Connector', store=True, readonly=True)
    date_message = fields.Datetime('Date', required=True, default=fields.Datetime.now, copy=False)
    read_date = fields.Datetime('Read Date', index=True, copy=False)
    from_me = fields.Boolean('Message From Me', index=True)
    company_id = fields.Many2one('res.company', related='contact_id.company_id',
                                 string='Company', store=True, readonly=True)
    ttype = fields.Selection(selection_add=[('contact', 'Contact'), ('url', 'URL')],
                             ondelete={'contact': 'cascade', 'url': 'cascade'})
    error_msg = fields.Char('Error Message', readonly=True, copy=False)
    event = fields.Selection([('unanswered', 'Unanswered Message'),  # user asignado
                              ('to_new', 'New Conversation'),  # user que lo hizo o none
                              ('to_curr', 'Start Conversation'),  # user asignado
                              ('to_done', 'End Conversation'),  # user que lo hizo
                              ],
                             string='Event')
    user_id = fields.Many2one('res.users', string='Agent')
    try_count = fields.Integer('Try counter', default=0)
    show_product_text = fields.Boolean('Show Product Text', default=True)
    title_color = fields.Char(related='connector_id.border_color', store=False)
    is_signed = fields.Boolean('Is Signed', default=False)
    template_waba_id = fields.Many2one('acrux.chat.template.waba', 'Template',
                                       ondelete='set null')
    template_params = fields.Text('Params')
    template_data = fields.Text('Template Message')
    mute_notify = fields.Boolean()
    is_product = fields.Boolean('Is product')
    metadata_type = fields.Selection([('apichat_preview_post', 'apichat_preview_post'),
                                      ('button_replay', 'button_replay'),
                                      ('ad', 'ad'),
                                      ('none', 'None')],
                                     default='none', required=True)
    metadata_json = fields.Text('Metadata text')
    button_ids = fields.One2many('acrux.chat.message.button', 'message_id',
                                 string='Whatsapp Buttons')
    chat_list_id = fields.Many2one(ondelete='restrict')
    transcription = fields.Text('Transcription')
    traduction = fields.Text('Traduction')
    url_due = fields.Boolean('Url is Due?', default=False)
    custom_url = fields.Char('Custom URL')
    contact_name = fields.Char('Author Name')
    contact_number = fields.Char('Author Number')
    date_delete = fields.Datetime('Date Delete')
    quote_id = fields.Many2one('acrux.chat.message', 'Queted Message', ondelete='set null')

    @api.depends('text')
    def _compute_name(self):
        for r in self:
            if r.text:
                txt = r.text
                r.name = txt if len(txt) <= 10 else txt[:10] + '...'
            else:
                r.name = '/'

    @api.model
    def get_contact_user(self, conv_id):
        if not conv_id:
            return False
        Conv = self.env['acrux.chat.conversation']
        conv_id = Conv.browse([conv_id])
        return conv_id.agent_id or conv_id.res_partner_id.user_id or False

    @api.model_create_multi
    def create(self, vals_list):
        for vals in vals_list:
            if 'user_id' not in vals:
                from_me = vals.get('from_me')
                user_id = False
                if not from_me:
                    user_id = self.get_contact_user(vals.get('contact_id'))
                if not user_id:
                    user_id = self.env.user
                if user_id:
                    vals.update(user_id=user_id.id)
        return super(AcruxChatMessages, self).create(vals_list)

    def copy(self, default=None):
        default = default or {}
        if self.chat_list_id and 'chat_list_id' not in default:
            default['chat_list_id'] = self.chat_list_id.copy().id
        new_message = super(AcruxChatMessages, self).copy(default)
        for button_id in self.button_ids:
            button_id.copy(default={'message_id': new_message.id})
        return new_message

    @api.model
    def unlink_attachment(self, attach_to_del_ids, only_old=True):
        data = [('id', 'in', attach_to_del_ids)]
        if only_old:
            data.append(('delete_old', '=', True))
        to_del = self.env['ir.attachment'].sudo().search(data)
        erased_ids = to_del.ids
        to_del.unlink()
        return erased_ids

    def clean_content(self):
        mess_ids = self.filtered(lambda x: x.res_model == 'ir.attachment' and x.res_id)
        attach_to_del = mess_ids.mapped('res_id')
        mess_ids.unlink_attachment(attach_to_del, only_old=False)
        mess_ids.write({'res_model': False, 'res_id': 0})
        self.filtered(lambda msg: msg.ttype == 'url').write({'url': False})

    def unlink(self):
        ''' Delete attachment too '''
        mess_ids = self.filtered(lambda x: x.res_model == 'ir.attachment' and x.res_id)
        attach_to_del = mess_ids.mapped('res_id')
        ret = super(AcruxChatMessages, self).unlink()
        if attach_to_del:
            self.unlink_attachment(attach_to_del)
        return ret

    @api.model
    def get_fields_to_read(self):
        return ['id', 'text', 'ttype', 'date_message', 'from_me', 'res_model',
                'res_id', 'error_msg', 'show_product_text', 'title_color',
                'user_id', 'metadata_type', 'metadata_json', 'button_ids', 'create_uid',
                'chat_list_id', 'transcription', 'traduction', 'url_due', 'custom_url',
                'contact_name', 'contact_number', 'quote_id', 'date_delete']

    def get_js_dict(self):
        fields_to_read = self.get_fields_to_read()
        out = self.read(fields_to_read)
        ListModel = self.env['acrux.chat.message.list']
        ButtonModel = self.env['acrux.chat.message.button']
        button_fields = self.env['acrux.chat.button.base'].fields_get().keys()
        fields_to_read = list(filter(lambda key: key != 'quote_id', fields_to_read))
        quoted_data = {msg['id']: msg for msg in self.mapped('quote_id').read(fields_to_read)}
        for record in out:
            if record['button_ids']:
                record['button_ids'] = ButtonModel.browse(record['button_ids']).read(button_fields)
            if record['chat_list_id']:
                button_text = ListModel.browse(record['chat_list_id'][0]).read(['button_text'])[0]['button_text']
                record['chat_list_id'] = list(record['chat_list_id'])
                record['chat_list_id'].append(button_text)
            if record['quote_id']:
                record['quote_id'] = quoted_data[record['quote_id'][0]]
        return out

    def get_url_image(self, res_model, res_id, field='image_256', prod_id=False):
        self.ensure_one()
        url = False
        if not prod_id:
            ''' res_model: product or template '''
            prod_id = self.env[res_model].search([('id', '=', res_id)])
        if prod_id:
            field_obj = getattr(prod_id, field)
            if not field_obj:
                return prod_id, False
            check_weight = self.message_check_weight(field=field_obj)
            if check_weight:
                url = self.connector_id.get_url_from_model_field(prod_id, field, field_obj=field_obj)
        return prod_id, url

    def get_url_attach(self, att_id):
        self.ensure_one()
        url = False
        attach_id = self.env['ir.attachment'].sudo().browse(att_id)
        if attach_id:
            self.message_check_weight(value=attach_id.file_size, raise_on=True)
            url = self.connector_id.get_url_from_attachment(attach_id)
        if attach_id and attach_id.mimetype and self.connector_id.is_instagram():
            allowed_formats = []
            if attach_id.mimetype.startswith('audio'):
                allowed_formats = INSTAGRAM_AUDIO_FORMAT_ALLOWED
            elif attach_id.mimetype.startswith('video'):
                allowed_formats = INSTAGRAM_VIDEO_FORMAT_ALLOWED
            if allowed_formats and attach_id.mimetype not in allowed_formats:
                file_type = attach_id.mimetype.split('/')[0]
                raise ValidationError(_('Only %s formats are allowed. Try to install pydub and ffmpeg '
                                        'libraries (In debian distros pip install pydub and apt install ffmpeg).')
                                      % file_type)
        return attach_id, url

    def message_parse(self):
        ''' Return message formated '''
        self.ensure_one()
        message = False
        if self.ttype == 'text':
            message = self.ca_ttype_text()
        elif self.ttype in ['image', 'video', 'file', 'sticker']:
            message = self.ca_ttype_file()
            if self.ttype == 'sticker':
                del message['filename']
        elif self.ttype == 'audio':
            message = self.ca_ttype_audio()
        elif self.ttype == 'product':
            raise ValidationError('Not implemented')
        elif self.ttype == 'location':
            message = self.ca_ttype_location()
        elif self.ttype == 'contact':
            raise ValidationError('Not implemented')
        if self.template_waba_id:
            self.set_template_data(message)
        if self.button_ids:
            self.set_buttons(message)
        elif self.chat_list_id:
            self.set_list(message)
        if self.quote_id and self.quote_id.msgid:
            message['quote_msg_id'] = self.quote_id.msgid
        message.update({
            'to': self.contact_id.number,
            'chat_type': self.contact_id.conv_type,
            'id': str(self.id),
        })
        '''
            :todo resolver messaging_type
            https://developers.facebook.com/docs/messenger-platform/send-messages
            https://developers.facebook.com/docs/messenger-platform/send-messages/message-tags
        '''
        if self.connector_id.is_facebook_or_instagram():
            message['messaging_type'] = 'RESPONSE'
            if self.connector_id.is_facebook():
                if message['type'] not in ('text', 'image', 'video', 'audio', 'file'):
                    raise ValidationError(_('Message type is not supported.'))
            elif self.connector_id.is_instagram():
                if message['type'] not in ('text', 'image', 'video', 'audio'):
                    raise ValidationError(_('Message type is not supported.'))
            if message['type'] in ('image', 'video', 'file') and message.get('text', ''):
                raise ValidationError(_('Text in this message is not supported.'))
        return message

    def set_template_data(self, message):
        self.ensure_one()
        if self.connector_id.connector_type == 'gupshup':
            message['template_id'] = self.template_waba_id.template_id
            params = json.loads(self.template_params)
            message['params'] = params['params']
            if self.template_data:
                message['template_data'] = json.loads(self.template_data)
        elif self.connector_id.is_waba_extern():
            message['template_id'] = self.template_waba_id.name
            params = json.loads(self.template_params)
            message['params'] = params['params']
            message['template_lang'] = self.template_waba_id.language_code

    def set_buttons(self, message):
        def map_button(btn):
            out = {
                'id': btn.btn_id,
                'type': btn.ttype,
                'text': btn.text,
            }
            if btn.ttype == 'url':
                out['url'] = btn.url
            elif btn.ttype == 'call':
                out['phone'] = btn.phone
            return out

        self.ensure_one()
        if self.connector_id.connector_type in ['gupshup', 'apichat.io']:
            message['buttons'] = self.button_ids.mapped(map_button)

    def set_list(self, message):
        def map_button(btn):
            out = {
                'id': btn.btn_id,
                'type': btn.ttype,
                'text': btn.text,
            }
            if btn.description:
                out['description'] = btn.description
            return out

        def map_item(item):
            return {
                'title': item.name,
                'buttons': item.button_ids.mapped(map_button),
            }

        self.ensure_one()
        if self.connector_id.connector_type in ['gupshup']:
            message['list'] = {
                'title': self.chat_list_id.name,
                'button_text': self.chat_list_id.button_text,
                'items': self.chat_list_id.items_ids.mapped(map_item),
            }

    def get_request_path(self):
        self.ensure_one()
        return 'send'

    def message_send(self):
        '''Return msgid
        In: {'type': string (required) ['text', 'image', 'video', 'file', 'audio', 'location'],
             'text': string (required),
             'from': string,
             'to': string,
             'filename': string,
             'url': string,
             'address': string,
             'latitude': string,
             'longitude': string,
             }
        Out: {'msg_id': [string, False],
              }
        '''
        self.ensure_one()
        ret = False
        connector_id = self.contact_id.connector_id
        if not self.ttype.startswith('info'):
            self.message_check_allow_send()
            self.sign()
            data = self.message_parse() or {}
            result = connector_id.ca_request(self.get_request_path(), data)
            msg_id = result.get('msg_id', False)
            if msg_id:
                self.msgid = msg_id
                return msg_id
            else:
                raise ValidationError('Server error.')
        else:
            return ret

    def sign(self):
        self.ensure_one()
        if not self.is_signed and self.text:
            if self.connector_id.allow_signing and self.env.user.chatroom_signing_active \
                    and self.ttype not in ['contact', 'location']:
                self.is_signed = True
                if self.env.user.chatroom_signing:
                    self.text = '%s\n%s' % (self.env.user.chatroom_signing, self.text)
                else:
                    self.text = '%s:\n%s' % (self.env.user.name, self.text)

    def message_check_time(self, raise_on_error=True):
        self.ensure_one()
        if self.connector_id.connector_type == 'gupshup' and self.template_waba_id:
            return True
        contact_id = self.contact_id
        last_received = contact_id.last_received
        max_hours = contact_id.connector_id.time_to_respond
        if max_hours and max_hours > 0:
            if not last_received:
                if raise_on_error:
                    if self.connector_id.connector_type == 'gupshup':
                        raise ValidationError(_('You must send a WABA Template to initiate a conversation.'))
                    raise ValidationError(_('The client must have started a conversation.'))
                return False
            diff_hours = date_delta_seconds(last_received) / 3600
            if diff_hours >= max_hours:
                if raise_on_error:
                    raise ValidationError(_('The time to respond exceeded (%s hours). '
                                          'The limit is %s hours.') % (int(round(diff_hours)), max_hours))
                return False
        return True

    def message_check_allow_send(self):
        ''' Check elapsed time '''
        self.ensure_one()
        if self.text and len(self.text) >= 4000:
            raise ValidationError(_('Message is to large (4.000 caracters).'))
        connector_id = self.contact_id.connector_id
        if not connector_id.ca_status:
            raise ValidationError(_('Sorry, you can\'t send messages.\n%s is not connected.' % connector_id.name))
        if connector_id.connector_type == 'gupshup':
            self.message_check_time()
            if not self.contact_id.is_waba_opt_in:
                raise ValidationError(_('You must request opt-in before send a template message.'))
        elif self.connector_id.is_facebook_or_instagram():
            self.message_check_time()

    def message_check_weight(self, field=None, value=None, raise_on=False):
        ''' Check size '''
        self.ensure_one()
        ret = True
        limit = int(self.env['ir.config_parameter'].sudo().get_param('acrux_max_weight_kb') or '0')
        if limit > 0:
            limit *= 1024  # el parametro esta en kb pero el value pasa en bytes
            if field:
                value = len(base64.b64decode(field) if field else b'')
            if (value or 0) >= limit:
                if raise_on:
                    msg = '%s Kb' % limit if limit < 1000 else '%s Mb' % (limit / 1000)
                    raise ValidationError(_('Attachment exceeds the maximum size allowed (%s).') % msg)
                return False
        return ret

    def ca_ttype_text(self):
        self.ensure_one()
        ret = {
            'type': 'text',
            'text': self.text
        }
        return ret

    def ca_ttype_audio(self):
        self.ensure_one()
        if not self.res_id or self.res_model != 'ir.attachment':
            raise ValidationError(_('Attachment type is required.'))
        attach_id, url = self.get_url_attach(self.res_id)
        if not attach_id:
            raise ValidationError(_('Attachment is required.'))
        if not url:
            raise ValidationError(_('URL Attachment is required.'))
        ret = {
            'type': 'audio',
            'url': url
        }
        return ret

    def ca_ttype_file(self):
        self.ensure_one()
        if not self.res_id or self.res_model != 'ir.attachment':
            raise ValidationError(_('Attachment type is required.'))
        if self.is_product:
            attach_id = self.env['ir.attachment'].sudo().browse(self.res_id)
            ''' prod_id: return product or template '''
            prod_id, url = self.get_url_image(res_model=attach_id.res_model, res_id=attach_id.res_id,
                                              field=attach_id.res_field)
            filename = prod_id.display_name
            mimetype = attach_id and attach_id.mimetype
            if mimetype:
                ext = mimetype.split('/')
                if len(ext) == 2:
                    filename = '%s.%s' % (filename, ext[1])
        else:
            attach_id, url = self.get_url_attach(self.res_id)
            filename = attach_id.name
            if not attach_id:
                raise ValidationError(_('Attachment is required.'))
            if not url:
                raise ValidationError(_('URL Attachment is required.'))
        if not url:
            ret = {
                'type': 'text',
                'text': self.text or ''
            }
        else:
            ret = {
                'type': self.ttype,
                'text': self.text or '',
                'filename': secure_filename(filename),
                'url': url
            }
        return ret

    def ca_ttype_location(self):
        ''' Text format:
                name
                address
                latitude, longitude
        '''
        self.ensure_one()
        parse = self.text.split('\n')
        if len(parse) != 3:
            return self.ca_ttype_text()
        cords = parse[2].split(',')
        ret = {
            'type': 'location',
            'address': '%s\n%s' % (parse[0].strip(), parse[1].strip()),
            'latitude': cords[0].strip('( '),
            'longitude': cords[1].strip(') '),
        }
        return ret

    def add_attachment(self, data):
        self.ensure_one()
        url = data['url']
        if url.startswith('http'):
            try:
                headers = None
                if self.connector_id.connector_type == 'waba_extern':
                    if 'identify=' in url:
                        split = url.split('identify=')
                        identify = split[1]
                        url = split[0].rstrip('&')
                        headers = {'Authorization': 'Bearer ' + identify}
                attach_id = create_attachment_from_url(self.env, url, self, data.get('filename'), headers)
                self.write({'res_model': 'ir.attachment', 'res_id': attach_id.id})
            except Exception:
                traceback.print_exc()
                self.write({'text': (self.text + ' ' + _('[Error getting %s ]') % url[:50]).strip(),
                            'ttype': 'text'})
        else:
            self.write({'text': (self.text + ' [Error %s]' % url).strip(),
                        'ttype': 'text'})

    def post_create_from_json(self, data):
        self.ensure_one()
        if data['ttype'] in ['image', 'audio', 'video', 'file', 'sticker']:
            self.add_attachment(data)
        if data.get('metadata'):
            self.metadata_json = json.dumps(data['metadata'], indent=2)
            if self.contact_id.connector_type == 'apichat.io':
                self.process_metadata_apichat(data)
            elif self.contact_id.connector_type == 'gupshup':
                self.process_metadata_gupshup(data)
        if self.ttype == 'url':
            self.custom_url = data['url']
        self.contact_name = data.get('contact_name')
        self.contact_number = data.get('contact_number')

    def process_metadata_gupshup(self, data):
        self.ensure_one()
        self.metadata_type = 'button_replay'

    def process_metadata_apichat(self, data):
        self.ensure_one()
        if data['metadata'].get('type') == 'button_replay':
            self.metadata_type = 'button_replay'
        elif data['metadata'].get('type') == 'post':
            self.metadata_type = 'apichat_preview_post'
        elif data['metadata'].get('type') == 'ad':
            self.metadata_type = 'ad'

    def process_message_event(self, data):
        self.ensure_one()
        if data['type'] == 'failed':
            self.error_msg = data['reason']
        elif data['type'] == 'deleted':
            self.set_deleted()

    def set_deleted(self):
        self.clean_content()
        self.write({
            'ttype': 'text',
            'text': _('Deleted'),
            'date_delete': fields.Datetime.now()
        })

    @api.constrains('button_ids', 'connector_id', 'ttype')
    def _constrains_button_ids(self):
        for message in self:
            if message.button_ids and message.connector_id and message.ttype:
                if message.connector_id.connector_type == 'apichat.io':
                    if message.ttype not in ['text', 'image', 'video', 'file', 'location']:
                        raise ValidationError(_('Button message not supported for type %s') % message.ttype)
                elif message.connector_id.connector_type == 'gupshup':
                    if message.ttype not in ['text', 'image', 'video', 'file']:
                        raise ValidationError(_('Button message not supported for type %s') % message.ttype)
                    if any(btn_type != 'replay' for btn_type in message.button_ids.mapped('ttype')):
                        raise ValidationError(_('For this connector only quick reply button is allowed.'))
                    if not (0 < len(message.button_ids) < 4):
                        raise ValidationError(_('For this connector only 3 buttons are allowed.'))
                else:
                    raise ValidationError(_('Button message not supported'))
                button_ids = message.button_ids.mapped('btn_id')
                if len(button_ids) != len(set(button_ids)):
                    raise ValidationError(_('Id for buttons must be unique.'))

    def send_message_ui(self):
        if self.msgid:
            raise ValidationError(_('Message already sent, msg_id is set.'))
        self.message_send()
        return self.env['acrux.chat.pop.message'].message(_('Message sent'))

    @api.constrains('chat_list_id', 'ttype', 'text')
    def _constrains_chat_list_id_type(self):
        super(AcruxChatMessages, self)._constrains_chat_list_id_type()

    @api.constrains('chat_list_id', 'button_ids')
    def _constrains_button_list(self):
        super(AcruxChatMessages, self)._constrains_button_list()

    @api.model
    def do_transcribe(self, ai_config_id, attach_id, conversation_id=None):
        attach = self.env['ir.attachment'].sudo().browse(attach_id)
        if not attach:
            raise ValidationError(_('Attachment is required.'))
        ai_config = self.env['acrux.chat.ai.config'].browse(ai_config_id)
        conversation = None
        if conversation_id:
            if type(conversation_id) in [str, int]:
                conversation = self.browse(conversation_id)
            else:
                conversation = conversation
        return ai_config.execute_ai(attach, conversation=conversation)

    def transcribe(self, ai_config_id):
        self.ensure_one()
        if self.ttype not in ['audio', 'video']:
            raise ValidationError(_('It can only transcribe audio or video messages.'))
        if not self.res_id or self.res_model != 'ir.attachment':
            raise ValidationError(_('Attachment type is required.'))
        self.transcription = self.do_transcribe(ai_config_id, self.res_id, self.contact_id)
        return self.transcription

    @api.model
    def do_translate(self, ai_config_id, text, conversation=None, target_lang=None, source_lang=None):
        if not text:
            raise ValidationError(_('There is nothing to translate.'))
        ai_config = self.env['acrux.chat.ai.config'].browse(ai_config_id) if type(ai_config_id) == int else ai_config_id
        return ai_config.execute_ai(text, conversation=conversation, target_lang=target_lang, source_lang=source_lang)

    @api.model
    def _get_parnter_lang(self, lang_id=None):
        partner_lang = None
        if lang_id:
            partner_lang = self.env['res.lang'].with_context(active_test=False).browse(lang_id).code
        elif self.contact_id.res_partner_id:
            partner_lang = self.contact_id.res_partner_id.lang
        elif self.connector_id.allowed_lang_ids:
            partner_lang = self.connector_id.allowed_lang_ids[0].code
        return partner_lang

    def translate(self, ai_config_id, lang_id=None):
        self.ensure_one()
        if not self.text and not self.transcription:
            raise ValidationError(_('There is nothing to translate.'))
        target_lang = None
        source_lang = None
        if self.from_me:
            source_lang = self.env.user.lang
            target_lang = self._get_parnter_lang(lang_id)
        else:
            target_lang = self.env.user.lang
            source_lang = self._get_parnter_lang(lang_id)
        text = self.text or self.transcription
        self.traduction = self.do_translate(ai_config_id, text, conversation=self.contact_id,
                                            target_lang=target_lang, source_lang=source_lang)
        return self.traduction

    @api.model
    def translate_text(self, ai_config_id, text, lang_id=None, conversation_id=None):
        target_lang = self._get_parnter_lang(lang_id)
        source_lang = self.env.user.lang
        conversation_id = self.env['acrux.chat.conversation'].browse(conversation_id) if conversation_id else None
        return self.do_translate(ai_config_id, text, conversation=conversation_id,
                                 target_lang=target_lang, source_lang=source_lang)

    def check_url_due(self):
        self.ensure_one()
        datas = None
        mime = None
        try:
            req = requests.get(self.custom_url)
            if req.status_code == 200:
                datas = base64.b64encode(req.content).decode('ascii')
                if '; ' in req.headers['Content-Type']:
                    mime = req.headers['Content-Type'].split('; ')[0]
                else:
                    mime = req.headers['Content-Type']
            else:
                self.url_due = True
        except Exception:
            self.url_due = True
        return {
            'url_due': self.url_due,
            'mime': mime,
            'data': datas
        }
