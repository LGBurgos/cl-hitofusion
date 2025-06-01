# -*- coding: utf-8 -*-

from odoo import models, fields, api, _
from odoo.exceptions import ValidationError
from odoo.addons.whatsapp_connector.tools import log_request_error


class Connector(models.Model):
    _inherit = 'acrux.chat.connector'

    connector_type = fields.Selection(selection_add=[('wechat', 'WeChat')], ondelete={'wechat': 'cascade'})

    @api.onchange('connector_type')
    def _onchange_connector_type(self):
        super()._onchange_connector_type()
        if self.is_wechat():
            self.endpoint = 'https://social.acruxlab.net/prod/v1/wechat'
            self.time_to_respond = 48

    def get_api_url(self, path=''):
        '''
            :overide
        '''
        self.ensure_one()
        if self.is_wechat():
            out = self.wechat_api_url(path)
        else:
            out = super().get_api_url(path)
        return out

    def ca_get_status(self):
        '''
            :overide
        '''
        self.ensure_one()
        if self.is_wechat():
            out = self.wechat_get_status()
        else:
            out = super().ca_get_status()
        return out

    def get_actions(self):
        '''
            :overide
        '''
        self.ensure_one()
        if self.is_wechat():
            out = self.wechat_get_actions()
        else:
            out = super(Connector, self).get_actions()
        return out

    def response_handler(self, req):
        '''
            :overide
        '''
        self.ensure_one()
        if self.is_wechat():
            if req.status_code == 200:
                try:
                    out = req.json()
                except ValueError:
                    out = {}
            else:
                log_request_error([req.text or req.reason], req)
                raise ValidationError(req.text or req.reason)
        else:
            out = super(Connector, self).response_handler(req)
        return out

    def ca_request(self, path, data={}, params={}, timeout=False, ignore_exception=False):
        '''
            :overide
        '''
        self.ensure_one()
        if self.is_wechat():
            path = self.get_wechat_path(path)
            if path is None:
                return
        vals = {
            'path': path,
            'data': data,
            'params': params,
            'timeout': timeout,
            'ignore_exception': ignore_exception
        }
        return super(Connector, self).ca_request(**vals)

    def get_wechat_path(self, path):
        if path == 'status_get':
            path = 'status'
        elif path == 'config_set':
            path = 'config'
        elif path == 'contact_get':
            path = 'contact'
        elif path == 'send':
            path = 'sendMessage'
        elif path == 'msg_set_read':
            path = None
        elif path == 'status_logout':
            path = 'logout'
        elif path == 'template_get':
            path = None
        return path

    def assert_id(self, key):
        '''
            :overide
        '''
        if not self.is_wechat():
            super(Connector, self).assert_id(key)

    def clean_id(self, key):
        '''
            :overide
        '''
        out = False
        if self.is_wechat():
            out = key
        else:
            out = super(Connector, self).clean_id(key)
        return out

    def format_id(self, key):
        '''
            :overide
        '''
        if self.is_wechat():
            out = 'WeChat'
        else:
            out = super(Connector, self).format_id(key)
        return out

    def is_wechat(self):
        return self.connector_type == 'wechat'

    def wechat_api_url(self, path):
        self.ensure_one()
        return '%s/%s' % (self.endpoint.strip('/'), path)

    @api.model
    def wechat_get_actions(self):
        return {
            'status': 'get',
            'config': 'post',
            'contact': 'get',
            'logout': 'post',
            'readChat': 'post',
            'sendMessage': 'post',
            'templates': 'get',
        }

    def wechat_get_status(self):
        self.ensure_one()
        if self.connector_type == 'not_set':
            raise ValidationError(_('"Connect to" is not set, check out your config.'))
        Pop = self.env['acrux.chat.pop.message']
        self.ca_qr_code = False
        params = {
            'webhook': self.webhook_url,
            'lang': self.env.context.get('lang', 'en'),
        }
        data = self.ca_request('status', timeout=20, params=params)
        message, detail = self.process_wechat_get_status(data)
        return Pop.message(message, detail)

    def process_wechat_get_status(self, data):
        self.ensure_one()
        message = detail = False
        if 'is_connected' in data:
            if data['is_connected']:
                detail = _('Connected')
                message = 'Status'
                self.ca_status = True
                self.message = detail
                self.ca_set_settings()
            else:
                message = 'Status'
                detail = data.get('reason', _('An unexpected error occurred'))
                self.ca_status = False
                self.message = detail
        else:
            self.ca_status = False
            message = 'An unexpected error occurred. Please try again.'
            self.message = message
        return message, detail

    def allow_caption(self):
        out = super(Connector, self).allow_caption()
        if self.is_wechat():
            out = False
        return out

    def get_url_from_attachment(self, attach_id):
        '''
            :overide
        '''
        self.ensure_one()
        if self.is_wechat():
            ttype = attach_id.mimetype.split('/')[0]
            if ttype in ('audio', 'image', 'video'):
                attachment_data = attach_id.datas
                url = f'data:{attach_id.mimetype};base64,{attachment_data.decode("utf-8")}'
            else:
                url = super().get_url_from_attachment(attach_id)
        else:
            url = super().get_url_from_attachment(attach_id)
        return url

    def get_url_from_model_field(self, record, field, field_obj=None):
        self.ensure_one()
        if self.is_wechat():
            url = f'data:image/jpeg;base64,{field_obj.decode("utf-8")}'
        else:
            url = super().get_url_from_model_field(record, field, field_obj=field_obj)
        return url
