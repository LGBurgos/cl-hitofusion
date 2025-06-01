# -*- coding: utf-8 -*-
import json
from odoo import models, fields, api, _, tools
from odoo.exceptions import ValidationError


class ChatMessageWizard(models.TransientModel):
    _name = 'acrux.chat.message.wizard'
    _description = 'ChatRoom Message'

    def _domain_conversation_id(self):
        conversation_id = self.env.context.get('conversation_id') or self.env.context.get('default_conversation_id')
        if self.env.context.get('is_acrux_chat_room') and conversation_id:
            return [('id', 'in', [conversation_id])]
        partner_id = self.env['res.partner'].browse(self.env.context.get('default_partner_id', []))
        conv_ids = partner_id.contact_ids.ids + [conversation_id]
        conv_ids = list(set([x for x in conv_ids if x]))
        return [('id', 'in', conv_ids)] if conv_ids else []

    new_number = fields.Boolean('New number')
    number = fields.Char('Number')
    numbers_available = fields.Text('Available', compute='_compute_numbers_available', store=False, readonly=True)
    text = fields.Text('Message', required=True)
    partner_id = fields.Many2one('res.partner')
    conversation_id = fields.Many2one('acrux.chat.conversation', string='ChatRoom', ondelete='set null',
                                      domain=_domain_conversation_id)
    connector_id = fields.Many2one('acrux.chat.connector', string='Channel', ondelete='set null')
    conn_type = fields.Char(compute='_compute_connector_type', store=False, readonly=True)
    invisible_top = fields.Boolean()

    template_id = fields.Many2one('mail.template', 'Template',
                                  domain="[('model', '=', model), ('name', 'ilike', 'ChatRoom')]")
    invisible_template = fields.Boolean(compute='_compute_invisible_template')
    attachment_ids = fields.Many2many('ir.attachment', 'acrux_chat_message_wizard_ir_attachments_rel',
                                      'wizard_id', 'attachment_id', 'Attach a file')
    model = fields.Char('Related Document Model')
    res_id = fields.Integer('Related Document ID')
    conv_opt_in = fields.Boolean(related='conversation_id.is_waba_opt_in')
    extra_text = fields.Char('Extra', compute='_compute_extra_text', store=False)

    @api.depends('model')
    def _compute_invisible_template(self):
        for rec in self:
            count_templ = self.env['mail.template'].search_count(
                [('model', '=', rec.model), ('name', 'ilike', 'ChatRoom')])
            rec.invisible_template = count_templ <= 0

    @api.depends('connector_id', 'conversation_id')
    def _compute_connector_type(self):
        for rec in self:
            rec.conn_type = rec.connector_id.connector_type or rec.conversation_id.connector_id.connector_type

    @api.depends('partner_id')
    def _compute_numbers_available(self):
        for rec in self:
            numbers = False
            p = rec.partner_id
            if p and p.mobile and p.phone != p.mobile:
                numbers = _('Mobile: %s\nPhone: %s') % (p.mobile or '', p.phone or '')
            rec.numbers_available = numbers

    @api.model
    def default_get_conversation(self):
        active_id = self.env.context.get('active_id')
        active_model = self.env.context.get('active_model')
        conversation_id = self.env.context.get('conversation_id') or self.env.context.get('default_conversation_id')
        if not conversation_id and active_id and active_model \
                and 'conversation_id' in self.env[active_model]._fields:
            conversation_id = self.env[active_model].browse(active_id).conversation_id.id
        if not conversation_id and self.env.context.get('default_partner_id'):
            contact_ids = self.env['res.partner'].browse([self.env.context.get('default_partner_id')]).contact_ids
            conversation_id = contact_ids[0].id if contact_ids else False
        return conversation_id

    @api.model
    def default_get(self, default_fields):
        vals = super(ChatMessageWizard, self).default_get(default_fields)
        if 'conversation_id' in default_fields:
            vals['conversation_id'] = self.default_get_conversation()
        if 'invisible_top' in default_fields and 'default_invisible_top' not in self.env.context \
                and self.env.context.get('is_acrux_chat_room') and vals.get('conversation_id'):
            vals['invisible_top'] = True
        if 'model' in default_fields and 'model' not in vals:
            vals['model'] = self.env.context.get('active_model')
        if 'res_id' in default_fields and 'res_id' not in vals:
            vals['res_id'] = self.env.context.get('active_id')
        return vals

    @api.autovacuum
    def _gc_lost_attachments(self):
        limit_date = fields.Datetime.subtract(fields.Datetime.now(), days=1)
        self.env['ir.attachment'].search([
            ('res_model', '=', 'acrux.chat.message.wizard'),
            ('res_id', '=', 0),
            ('create_date', '<', limit_date),
            ('write_date', '<', limit_date)]
        ).unlink()

    @api.onchange('new_number')
    def onchange_new_number(self):
        if self.partner_id and not self.number:
            self.number = self.partner_id.mobile or self.partner_id.phone or False
        if self.new_number:
            self.conversation_id = False
            exist = self.env['acrux.chat.connector'].search([], limit=1)
            self.connector_id = exist[0].id if exist else False
        else:
            self.connector_id = False
            if not self.conversation_id:
                self.conversation_id = self.default_get_conversation()

    @api.onchange('attachment_ids')
    def onchange_attachment_ids(self):
        Attachment = self.env['ir.attachment']
        for attac_id in self.attachment_ids:
            if not attac_id.access_token:
                data_attach = {
                    'name': attac_id.name,
                    'datas': attac_id.datas,
                    'res_model': 'acrux.chat.message.wizard',
                    'access_token': attac_id._generate_access_token(),
                    'res_id': 0,
                    'type': 'binary',  # override default_type from context, possibly meant for another model!
                    'delete_old': True,
                }
                new_id = Attachment.create(data_attach)
                self.attachment_ids = [(2, attac_id.id)]
                self.attachment_ids = [(4, new_id.id)]

    @api.onchange('template_id')
    def onchange_template_id_wrapper(self):
        self.ensure_one()
        self.attachment_ids = False
        res_id = self.res_id
        template_id = self.template_id.id
        if template_id:
            values = self.generate_email_for_composer(
                template_id, [res_id],
                ['body_html', 'attachment_ids', 'report_template_ids']
            )[res_id]
            attachment_ids = []
            Attachment = self.env['ir.attachment']
            for attach_fname, attach_datas in values.pop('attachments', []):
                data_attach = {
                    'name': attach_fname,
                    'datas': attach_datas,
                    'res_model': 'acrux.chat.message.wizard',
                    'access_token': Attachment._generate_access_token(),
                    'res_id': 0,
                    'type': 'binary',  # override default_type from context, possibly meant for another model!
                    'delete_old': True,
                }
                attachment_ids.append(Attachment.create(data_attach).id)
            if values.get('attachment_ids', []) or attachment_ids:
                values['attachment_ids'] = [(6, 0, values.get('attachment_ids', []) + attachment_ids)]
        else:
            values = {'text': False, 'attachment_ids': False}

        if values.get('body_html'):
            values['body'] = values.pop('body_html')
        if 'body' in values:
            values['text'] = values.pop('body')

        values = self._convert_to_write(values)

        for fname, value in values.items():
            setattr(self, fname, value)

    @api.model
    def generate_email_for_composer(self, template_id, res_ids, fields_list):
        multi_mode = True
        if isinstance(res_ids, int):
            multi_mode = False
            res_ids = [res_ids]

        returned_fields = fields_list + ['attachments']  # report_template_ids se devuelve en attachments
        values = dict.fromkeys(res_ids, False)

        template_values = self.env['mail.template'].with_context(tpl_partners_only=True).browse(
            template_id)._generate_template(res_ids, fields_list)
        for res_id in res_ids:
            res_id_values = dict((field, template_values[res_id][field]) for field in returned_fields
                                 if template_values[res_id].get(field))
            res_id_values['body'] = tools.html2plaintext(res_id_values.pop('body_html', '')).strip()
            self._parse_values(res_id_values)
            values[res_id] = res_id_values

        return multi_mode and values or values[res_ids[0]]

    @api.model
    def _parse_values(self, values):
        pass

    def _parse_msg_data(self, conv_id):
        txt_mes = {'ttype': 'text',
                   'from_me': True,
                   'contact_id': conv_id.id,
                   'text': self.text}
        msg_datas = [txt_mes]
        # esto en las versiones anteriores esta abajo
        if self.template_id:
            if self.template_id.waba_template_id:
                msg_datas = self._parse_msg_data_tempalte(msg_datas)
            if self.template_id.button_ids:
                btn_values = []
                for btn in self.template_id.button_ids:
                    btn_vals = btn.read()[0]
                    del btn_vals['template_id']
                    btn_values.append((0, 0, btn_vals))
                msg_datas[0]['button_ids'] = btn_values
            if self.template_id.chat_list_id:
                msg_datas[0]['chat_list_id'] = self.template_id.chat_list_id.id
        if self.attachment_ids:
            att_mes = {'ttype': 'file',
                       'from_me': True,
                       'contact_id': conv_id.id,
                       'res_model': 'ir.attachment'}
            for attac_id in self.attachment_ids.sorted(key='id'):
                if attac_id.mimetype in ['image/jpeg', 'image/png', 'image/gif']:
                    att_mes.update({'ttype': 'image'})
                else:
                    att_mes.update({'ttype': 'file'})
                attac_id.res_model = 'acrux.chat.message'
                att_mes.update({'text': attac_id.name,
                                'res_id': attac_id.id})
                if not conv_id.connector_id.allow_caption():
                    att_mes.update({'text': ''})
                msg_datas.append(dict(att_mes))
        return msg_datas

    def _parse_msg_data_tempalte(self, msg_datas):
        params = self.template_id.get_waba_param(self.res_id)
        msg = self._decide_and_merge_message(msg_datas)
        msg['template_waba_id'] = self.template_id.waba_template_id.id
        msg['template_params'] = json.dumps({'params': params})
        ttype = self.template_id.waba_template_id.template_type.lower()
        if ttype in ['document', 'image', 'video'] and self.template_id.waba_template_id.container_meta:
            try:
                template_data = json.loads(self.template_id.waba_template_id.container_meta)
                template_message = {'type': ttype}
                template_message[ttype] = {'id': template_data['mediaId']}
                msg['template_data'] = json.dumps(template_message)
            except Exception as e:
                print(e)
        msg_datas = [msg]
        return msg_datas

    def _decide_and_merge_message(self, msg_datas):
        out = None
        if len(msg_datas) == 1:
            out = msg_datas[0]
        elif len(msg_datas) == 2:
            text_message = None
            attach_message = None
            if msg_datas[0]['ttype'] == 'text' and msg_datas[1]['ttype'] in ['file', 'image', 'video']:
                text_message = msg_datas[0]
                attach_message = msg_datas[1]
            elif msg_datas[1]['ttype'] == 'text' and msg_datas[0]['ttype'] in ['file', 'image', 'video']:
                text_message = msg_datas[1]
                attach_message = msg_datas[0]
            if text_message and attach_message:
                attach_message['text'] = text_message['text']
                out = attach_message
            else:
                raise ValidationError(_('Message types cannot be merged.'))
        else:
            raise ValidationError(_('Too many message to handle them.'))
        return out

    def req_opt_in(self):
        self.ensure_one()
        if self.new_number:
            conv_id = self.create_or_find_conversation()
            self.conversation_id = conv_id
            self.new_number = False
        else:
            if not self.conversation_id:
                raise ValidationError(_('Enter required values'))
            conv_id = self.conversation_id
        conv_id.toggle_opt_in()
        return {
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'res_model': self._name,
            'target': 'new',
            'res_id': self.id
        }

    def send_message_wizard(self):
        self.ensure_one()
        self = self.with_context(not_log_event=True, is_from_wizard=True)
        if self.new_number:
            conv_id = self.create_or_find_conversation()
        else:
            if not self.conversation_id:
                raise ValidationError(_('Enter required values'))
            conv_id = self.conversation_id
        back_status = conv_id.status
        conv_id.block_conversation()
        msg_datas = self._parse_msg_data(conv_id)
        loop = 1
        for msg_data in msg_datas:
            if loop < len(msg_datas):
                back = 'current'
            else:
                back = back_status
            conv_id.send_message_bus_release(msg_data, back)
            loop += 1

    def create_or_find_conversation(self):
        Conv = self.env['acrux.chat.conversation']
        if not self.connector_id or not self.number \
                or self.connector_id.connector_type not in ['apichat.io', 'gupshup', 'waba_extern']:
            raise ValidationError(_('Enter required values'))
        number = self.connector_id.clean_id(self.number)
        exist = Conv.search([('connector_id', '=', self.connector_id.id), ('number', '=', number)], limit=1)
        if exist:
            name = (exist.res_partner_id or exist).name
            raise ValidationError(_('Number already exists (%s).') % name)
        conv_id = Conv.conversation_create(self.partner_id, self.connector_id.id, self.number)
        return conv_id

    @api.depends('template_id')
    def _compute_extra_text(self):
        for record in self:
            extra_text = []
            if record.template_id:
                if record.template_id.button_ids:
                    extra_text.append('\n'.join(map(lambda btn: '[ %s=%s ]' % (_('button'), btn),
                                                    record.template_id.button_ids.mapped('text'))))
                if record.template_id.chat_list_id:
                    extra_text.append('[ %s=%s ]' % (_('List'), record.template_id.chat_list_id.name))
            record.extra_text = '\n'.join(extra_text)
