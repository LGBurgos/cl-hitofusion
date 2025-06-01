# -*- coding: utf-8 -*-
import hashlib
import logging
import json
import sys
import requests
from random import randint
from datetime import datetime, timedelta
from odoo import models, fields, api, _
from odoo.tools import DEFAULT_SERVER_DATE_FORMAT
from odoo.exceptions import ValidationError, UserError
from odoo.addons.base.models.res_partner import _tz_get
from ..tools import TIMEOUT, log_request_error, get_image_from_url, phone_format
from ..tools import clean_number
_logger = logging.getLogger(__name__)


class AcruxChatConnector(models.Model):
    _name = 'acrux.chat.connector'
    _description = 'Connector Definition'
    _order = 'sequence, id'

    def _get_default_color(self):
        return randint(1, 11)

    name = fields.Char('Name', required=True, copy=False, default=_('Unnamed'))
    sequence = fields.Integer('Priority', required=True, default=1)
    message = fields.Html('Message', readonly=True, default='<i>Important information about the status of your '
                                                            'account will be displayed here.<br/>This value is '
                                                            'updated every time you press the "Check Status" '
                                                            'button.</i>')
    connector_type = fields.Selection([('not_set', 'Not set'),
                                       ('apichat.io', 'ApiChat.io'),
                                       ('gupshup', 'GupShup'),
                                       ('facebook', 'Facebook'),
                                       ('instagram', 'Instagram'),
                                       ('waba_extern', 'Waba Extern')],
                                      string='Connect to', default='apichat.io', required=True,
                                      help='Third-party connector type.')
    company_id = fields.Many2one('res.company', string='Company', required=True,
                                 default=lambda self: self.env.company)
    team_id = fields.Many2one('crm.team', string='Team', ondelete='set null')
    verify = fields.Boolean('Verify SSL', default=True, help='Set False if SSLError: bad handshake - ' +
                                                             'certificate verify failed.')
    source = fields.Char('Account (Instagram-FaceBook-Whatsapp)', required=True,
                         help='Instagram, FaceBook or Whatsapp phone number.')
    odoo_url = fields.Char('Odoo Url (WebHook)', required=True,
                           default=lambda x: x.env['ir.config_parameter'].sudo().get_param('web.base.url'),
                           help='Url to receive messages. Don\'t use http://localhost')
    endpoint = fields.Char('API Endpoint', required=True, default='https://api.acruxlab.net/prod/v2/odoo',
                           help='API Url. Please don\'t change.')
    token = fields.Char('Token', required=True, copy=False)
    uuid = fields.Char('Account ID', required=True, copy=False)
    time_to_respond = fields.Integer('Time to Respond (Hours)', default=24,
                                     help='Expiry time in hours to respond message without additional fee.\n' +
                                     'Null or 0 indicate no limit.')
    time_to_reasign = fields.Integer('Release unanswered conversation (Minutes)', default=10,
                                     help='Time in which the conversation is released to be taken by another user.')
    time_to_done = fields.Integer('End idle conversation (Days)', default=3,
                                  help='Number of days after which a conversation without movement ends automatically. '
                                       'Prevents your software works slow.')
    border_color = fields.Char(string='Border Color', size=7, compute='_compute_border_color',
                               help="Border color to differentiate conversation connector")
    color = fields.Integer('Color', default=_get_default_color, required=True)
    ca_status = fields.Boolean('Connected', default=False)
    ca_status_txt = fields.Char('Status')
    ca_qr_code = fields.Binary('QR Code')
    reassign_current_conversation = fields.Boolean('Release conversation if Agent\'s inactive',
                                                   default=False,
                                                   help="If the Agent who is attending a conversation is inactive, "
                                                        "when a new message arrives the conversation will go to New "
                                                        "so that another Agent can attend it.")
    tz = fields.Selection(_tz_get, string='Timezone', default=lambda self: self.env.context.get('tz'),
                          help='Default value if not defined in the user.')
    desk_notify = fields.Selection([('none', 'None'),
                                    ('mines', 'Only Mines'),
                                    ('all', 'All')], string='Notify', required=True,
                                   default='mines', help='When to send notification outside chatroom?')
    show_icon = fields.Boolean('Show Icon?', default=True)
    webhook_url = fields.Char('Webhook Url', compute='compute_webhook_url', store=False)
    auto_valid_number = fields.Boolean('Validate Numbers', default=False,
                                       help='Check if it exists in WhatsApp and repair.')
    valid_restriction = fields.Boolean('Restriction', default=False)
    validate_conn_id = fields.Many2one('acrux.chat.connector', string='Validate with',
                                       domain="[('connector_type', '=', 'apichat.io'),"
                                              "('validate_conn_id', '=', False),"
                                              "('id', '!=', id)]",
                                       ondelete='set null')
    valid_balance = fields.Integer('Available queries', readonly=True)
    valid_limit = fields.Integer('Query limit', readonly=True)
    valid_date = fields.Date('Until', readonly=True)
    allow_signing = fields.Boolean('Allow Signing', default=False)
    product_caption = fields.Text('Caption',
                                  default='list_price = format_price(product_id.lst_price)\n'
                                          'text = "%s\\n%s / %s" % (product_id.display_name.strip(), '
                                          'list_price, product_id.uom_id.name[:4])\n')
    chatroom_hide_branding = fields.Boolean('Hide Branding', compute='_compute_hide_branding', store=False)
    allowed_lang_ids = fields.Many2many('res.lang', string='Langs', context={'active_test': False},
                                        help='Langs that can be translated in this connector.')
    notify_discuss = fields.Boolean('Notify by Internal Chat', default=True,
                                    help='Send a message through Internal Chat reporting a change in a chat. '
                                         'Example: When another Agent Delegates a chat to you.')

    _sql_constraints = [
        ('name_uniq', 'unique (name)', _('Name must be unique.')),
        ('uuid_uniq', 'unique (uuid)', _('Identifier must be unique.')),
    ]

    @api.constrains('company_id', 'team_id')
    def constrains_company(self):
        for r in self:
            if r.team_id and r.team_id.company_id and r.team_id.company_id != r.company_id:
                raise ValidationError(_('CRM Team company does not apply.'))

    @api.model
    def default_get(self, default_fields):
        vals = super(AcruxChatConnector, self).default_get(default_fields)
        domain = [('company_id', 'in', [self.env.company.id, False])]
        vals['team_id'] = self.env['crm.team'].search(domain, limit=1).id
        return vals

    @api.onchange('company_id')
    def _onchange_company_id(self):
        if self.team_id.company_id.id != self.company_id.id:
            self.team_id = False

    @api.depends('color')
    def _compute_border_color(self):
        # buscar "$o-colors: " en .scss
        colors = ['#FFFFFF', '#F06050', '#F4A460', '#F7CD1F', '#6CC1ED', '#814968', '#EB7E7F',
                  '#2C8397', '#475577', '#D6145F', '#30C381', '#9365B8']
        for record in self:
            record.border_color = colors[record.color or 0]

    @api.depends('odoo_url', 'uuid')
    def compute_webhook_url(self):
        for record in self:
            if record.odoo_url and record.uuid:
                record.webhook_url = '%s/acrux_webhook/whatsapp_connector/%s' % \
                                     (record.odoo_url.rstrip('/'), record.uuid)
            else:
                record.webhook_url = False

    @api.onchange('connector_type')
    def _onchange_connector_type(self):
        if self.is_facebook():
            self.endpoint = 'https://social.acruxlab.net/prod/v1/fb'
        elif self.is_instagram():
            self.endpoint = 'https://social.acruxlab.net/prod/v1/in'
        elif self.is_waba_extern():
            self.endpoint = 'https://social.acruxlab.net/prod/v1/wa_ext'
        else:
            self.endpoint = 'https://api.acruxlab.net/prod/v2/odoo'

    @api.model
    def execute_maintenance(self, days=21):
        ''' Call from cron.
            Delete attachment older than N days. '''
        Message = self.env['acrux.chat.message']
        date_old = datetime.now() - timedelta(days=int(days))
        date_old = date_old.strftime(DEFAULT_SERVER_DATE_FORMAT)
        mess_ids = Message.search([('res_model', '=', 'ir.attachment'),
                                   ('res_id', '!=', False),
                                   ('date_message', '<', date_old)])
        attach_to_del = mess_ids.mapped('res_id')
        erased_ids = Message.unlink_attachment(attach_to_del)
        for mess_id in mess_ids:
            if mess_id.res_id in erased_ids:
                text = '%s\n(Attachment removed)' % mess_id.text
                mess_ids.write({'text': text.strip(),
                                'res_id': False})
        _logger.info('________ | execute_maintenance: Deleting %s attachments older than %s' %
                     (len(attach_to_del), date_old))

    def _get_custom_info(self):
        self.ensure_one()
        cp = self.company_id
        return {
            'odoo_url': self.odoo_url,
            'lang': cp.partner_id.lang,
            'phone': cp.phone,
            'website': cp.website,
            'currency': cp.currency_id.name,
            'country': cp.country_id.name,
            'name': cp.name,
            'email': cp.email,
        }

    def ca_set_settings(self):
        self.env.cr.commit()
        self.ensure_one()
        data = {'webhook': self.webhook_url, 'info': self._get_custom_info()}
        return self.ca_request('config_set', data)

    def ca_get_chat_list(self):
        self.ensure_one()
        data = self.ca_request('contact_get_all')
        dialogs = data.get('dialogs', [])
        vals = {}
        for user in dialogs:
            phone = user.get('id', '').split('@')[0]
            name = user.get('name', '')
            image_url = user.get('image', '')
            vals[phone] = {'name': name, 'image_url': image_url}
        self.process_chat_list(vals)

    def check_is_valid_old_records(self):
        self.ensure_one()
        self.check_is_valid_old_records_ids(False)

    def check_is_valid_old_records_ids(self, check_conv_ids):
        ''' Check all records, not API '''
        self.ensure_one()
        if self.connector_type != 'apichat.io':
            raise UserError(_('Available only for Whatsapp connector through apichat.io.'))
        domain = [('connector_id', '=', self.id), ('last_received', '!=', False), ('valid_number', 'in', ['no', False])]
        if check_conv_ids:
            domain.append(('id', 'in', check_conv_ids.ids))
        conv_ids = self.env['acrux.chat.conversation'].search(domain)
        conv_ids.valid_number = 'yes'

    def check_is_valid_active(self):
        return bool(self.connector_type == 'apichat.io' and self.auto_valid_number)

    def check_is_valid_update(self):
        self.ensure_one()
        if not self.check_is_valid_active():
            raise ValidationError(_('You have disabled this service.'))
        ret = self.ca_get_check_number([], raise_error=False)
        error = ret.get('error')
        if error:
            ret.update({'limit': 0, 'remain_limit': 0, 'date_due': str(self.valid_date or '')})
        self.valid_limit = ret.get('limit')
        self.valid_balance = ret.get('remain_limit')
        date_due = ret.get('date_due')[:10] if ret.get('date_due') else False
        self.valid_date = fields.Date.to_date(date_due) if date_due else False
        if error:
            return self.env['acrux.chat.pop.message'].message(error)

    def check_is_valid_whatsapp_number(self, conv_ids, overwrite=True, raise_error=True):
        ''' Returns max 20 records or error '''
        self.ensure_one()
        if not self.check_is_valid_active():
            return dict()
        numbers = [x.number for x in conv_ids if x.connector_type == 'apichat.io' and x.valid_number != 'yes']
        ret = self.ca_get_check_number(numbers[:20], raise_error)
        numbers = ret.get('numbers')
        if overwrite and numbers:
            for conv_id in conv_ids:
                check = numbers.get(conv_id.number)
                if check:
                    if check['valid']:
                        conv_id.valid_number = 'yes'
                        if not check['same']:
                            conv_id.number = check['number']
                    else:
                        conv_id.valid_number = 'no'
        return ret

    def ca_get_check_number(self, list_numbers, raise_error=True):
        ''' Returns max 20 records '''
        self.ensure_one()
        conn_id = self.validate_conn_id or self
        res = dict()
        if conn_id.connector_type != 'apichat.io':
            raise UserError(_('Available only for Whatsapp connector through apichat.io.'))
        txt_numbers = ''
        count = 0
        for n in list_numbers:
            x = self.clean_id(n)
            if x:
                count += 1
                txt_numbers += '%s,' % x
        if count > 20:
            raise UserError('max. 20 numbers')
        params = {'numbers': txt_numbers.strip(',')}
        try:
            datas = conn_id.ca_request('whatsapp_number_get', params=params, timeout=30)
            remain = datas.get('remain_limit', 0)
            numbers = datas.get('numbers', [])
        except ValidationError as _e:
            error = str(_e)
            reached = _('You reached the limit of your Validation Plan.')
            expired = _('Your Validation Plan has expired or not exist.')
            if error == 'You reached your package limit.':
                error = reached
            elif error == 'Your package is expired.':
                error = expired
            elif error == 'You have not contracted this package.':
                error = expired
            if raise_error:
                raise ValidationError(error)
            else:
                return {'error': error}
        for n in numbers:
            res[n['id']] = {'valid': bool(n['whatsapp_id'] or ''),
                            'same': bool(n['id'] == n['whatsapp_id']),
                            'number': n['whatsapp_id']}
        # print(json.dumps(res, indent=4, sort_keys=True))
        _logger.info('*check_number*\n%s' % res)
        return {'numbers': res,
                'remain_limit': remain,
                'date_due': datas.get('date_due', False),
                'limit': datas.get('limit', 0)}

    def process_chat_list(self, vals):
        self.ensure_one()
        Conversation = self.env['acrux.chat.conversation']
        for conv in Conversation.search([('image_128', '=', False)]):
            if conv.number in vals:
                image_url = vals[conv.number].get('image_url', '')
                if image_url and image_url.startswith('http'):
                    raw_image = get_image_from_url(image_url)
                    conv.image_128 = raw_image

    def ca_set_logout(self):
        self.ensure_one()
        self.ca_request('status_logout', timeout=20)
        self.ca_status = False
        self.ca_qr_code = False

    def ca_get_status(self):
        ''' API: {'status': {'acrux_ok': 'texto a mostrar'
                             ó 'acrux_er': 'texto a mostrar'
                             ó dict apichat.io}
                 }
        '''
        self.ensure_one()
        if self.connector_type == 'not_set':
            raise ValidationError(_('"Connect to" is not set, check out your config.'))
        Pop = self.env['acrux.chat.pop.message']
        if self.is_owner_facebook():
            self.ca_qr_code = False
            params = {
                'webhook': self.webhook_url,
                'lang': self.env.context.get('lang', 'en'),
            }
            data = self.ca_request('status', timeout=20, params=params)
            message, detail, redirectData = self.process_facebook_get_status(data)
            return Pop.message(message, detail) if message else redirectData
        message = detail = False
        self.ca_qr_code = False
        data = self.ca_request('status_get', timeout=20)
        status = data.get('status', {})
        acrux_ok = status.get('acrux_ok')
        acrux_er = status.get('acrux_er')
        accountStatus = status.get('accountStatus')
        if acrux_ok:
            self.ca_status = True
            self.message = acrux_ok
            message = 'Status'
            detail = acrux_ok
            self.ca_set_settings()
        elif acrux_er:
            self.ca_status = False
            self.message = acrux_er
            message = 'Status'
            detail = acrux_er
        elif accountStatus:
            qrCode = status.get('qrCode')
            if accountStatus == 'authenticated':
                self.ca_status = True
                self.message = False
                message = 'All good!'
                detail = 'WhatsApp connects to your phone to sync messages. ' \
                         'To reduce data usage, connect your phone to Wi-Fi.'
                self.ca_set_settings()
            elif accountStatus == 'got qr code':
                self.ca_status = False
                if qrCode:
                    self.ca_qr_code = qrCode.split('base64,')[1]
                    self.message = 'Please Scan QR code'
                else:
                    message = 'An unexpected error occurred. Please try again.'
                    self.message = message
            else:
                self.ca_status = False
                self.message = 'An unexpected error occurred. Please try again.'
                statusData = status.get('statusData')
                title = statusData.get('title')
                msg = statusData.get('msg')
                substatus = statusData.get('substatus')
                message = 'Status: %s' % (substatus or '-')
                detail = '<b>%s</b><br/>%s' % (title, msg)
        return Pop.message(message, detail) if message else True

    def ca_status_change(self, status):
        self.ensure_one()
        if status == 'connected':
            if not self.ca_status:
                self.ca_status = True
                self.ca_qr_code = False
                self.message = False
        elif status == 'disconnected':
            if self.ca_status:
                self.ca_status = False
                self.message = False

    def response_handler(self, req):
        self.ensure_one()
        error = False
        ret = {}
        if self.is_owner_facebook():
            if req.status_code == 200:
                try:
                    out = req.json()
                except ValueError:
                    out = {}
            else:
                log_request_error([req.text or req.reason], req)
                raise ValidationError(req.text or req.reason)
            return out
        try:
            ret = req.json()
        except ValueError:
            pass
        if req.status_code == 200:
            pass
        else:
            error = self.get_request_error_message(req, ret)
        if error:
            log_request_error([error], req)
            raise ValidationError(error)
        return ret

    def get_request_error_message(self, req, ret):
        ''' Estado respuesta:
                200        Ok (el resto hace raise)
                202        Accepted (error en el proveedor o cuenta impaga)
                204        No Content (método o parámetro no implementado para este conector)
                400        Bad request. Please pass a valid value in the parameters.
                403        Forbidden. Invalid authentication.
                404        Not found.
                500        Internal server error. (error en lambda)
            :param requests.Response req: request
            :return dict
        '''
        error = False
        if req.status_code == 202:
            error = ret.get('error', '3rd party connector error. Please try again or check configuration.')
        elif req.status_code == 204:
            error = ret.get('error', '3rd party connector not implement this option.')
        elif req.status_code == 400:
            error = ret.get('error', 'Bad request. Please pass a valid value in the parameters.')
        elif req.status_code == 403:
            error = ret.get('error', 'Forbidden. Invalid authentication.')
        elif req.status_code == 404:
            error = ret.get('error', 'Connector URL not found. Please set correctly.')
        elif req.status_code == 500:
            error = ret.get('error', 'Internal server error. Please try again.')
        else:
            error = ret.get('error', 'Unknown error.')
        return error

    def get_headers(self, path=''):
        self.ensure_one()
        return {
            'Accept': 'application/json',
            'token': self.token,
            'client_id': self.uuid,
            'action': path,
            'Content-Type': 'application/json'
        }

    def get_api_url(self, path=''):
        self.ensure_one()
        if self.is_owner_facebook():
            return '%s/%s' % (self.endpoint.strip('/'), path)
        return self.endpoint.strip('/')

    def get_actions(self):
        self.ensure_one()
        actions = {}
        if self.is_owner_facebook():
            actions = self.get_facebook_actions()
        else:
            actions = {
                'send': 'post',
                'msg_set_read': 'post',
                'config_get': 'get',
                'config_set': 'post',
                'status_get': 'get',
                'status_logout': 'post',
                'contact_get': 'get',
                'contact_get_all': 'get',
                'init_free_test': 'post',
                'whatsapp_number_get': 'get',
                'template_get': 'get',
                'opt_in': 'post',
            }
        actions['delete_message'] = 'delete'
        return actions

    def get_facebook_actions(self):
        return {
            'status': 'get',
            'config': 'post',
            'contact': 'get',
            'logout': 'post',
            'readChat': 'post',
            'sendMessage': 'post',
            'templates': 'get',
        }

    def get_req_method(self, action):
        actions = self.get_actions()
        if action not in actions:
            raise ValidationError(_('Action %s is not implemented.') % action)
        return actions[action]

    def hook_request_args(self, args):
        self.ensure_one()
        if args['headers']['action'] == 'status_logout':
            args['data'] = json.dumps({})  # backwards compatibility
        return args

    def ca_request(self, path, data={}, params={}, timeout=False, ignore_exception=False):
        self.ensure_one()
        if self.is_owner_facebook():
            path = self.get_facebook_path(path)
            if path is None:
                return
        method = self.get_req_method(path)
        result = {}
        timeout = timeout or TIMEOUT
        url = self.get_api_url(path)
        headers = self.get_headers(path)
        req = False
        try:
            args = {
                'url': url,
                'headers': headers,
                'timeout': timeout,
                'verify': self.verify,
            }
            if data:
                args['data'] = json.dumps(data)
            if params:
                args['params'] = params
            self.log_data(method, url, params, data, headers)
            args = self.hook_request_args(args)
            req = getattr(requests, method)(**args)
            result = self.response_handler(req)
        except requests.exceptions.SSLError:
            if not ignore_exception:
                log_request_error(['SSLError', method, path, params, data])
            raise UserError(_('Error! Could not connect to server. '
                              'Please in the connector settings, set the '
                              'parameter "Verify" to false by unchecking it and try again.'))
        except requests.exceptions.ConnectTimeout:
            if not ignore_exception:
                log_request_error(['ConnectTimeout', method, path, params, data])
            raise UserError(_('Timeout error. Try again...'))
        except (requests.exceptions.HTTPError,
                requests.exceptions.RequestException,
                requests.exceptions.ConnectionError):
            if not ignore_exception:
                log_request_error(['requests', method, path, params, data])
            ex_type, _ex_value, _ex_traceback = sys.exc_info()
            raise UserError(_('Could not connect to your account.\nPlease check API Endpoint Url.\n%s') % ex_type)
        self.log_result(method, url, result, params, data, req)
        return result

    def log_data(self, req_type, url, param, data, header):
        pass

    def log_result(self, req_type, url, result, param, data, req):
        pass

    def init_free_test(self):
        self.ensure_one()
        data = self._get_custom_info()
        self.uuid = 'test_demo_chat_api'  # backwards compatibility
        self.endpoint = 'https://api.acruxlab.net/test/v2/odoo'  # backwards compatibility
        data.update({'tz': self.env.user.tz})
        result = self.ca_request('init_free_test', data)
        connector_type = result.get('connector_type')
        if connector_type:
            self.connector_type = connector_type
        if result.get('token'):
            self.token = result.get('token')
        if result.get('uuid'):
            self.uuid = result.get('uuid')
        self.ca_status = False
        self.ca_qr_code = False
        self.message = False

    def init_free_test_wizard(self):
        self.ensure_one()
        if '//localhost' in self.odoo_url or '//127.0.' in self.odoo_url:
            raise UserError(_("Please set 'Odoo Url (WebHook)'.\n"
                              "You are working on 'localhost', you will not be able to receive messages!"))
        return {
            'name': _('Init Free Test'),
            'type': 'ir.actions.act_window',
            'view_mode': 'form',
            'res_model': 'init.free.test.wizard',
            'target': 'new',
            'context': dict(default_connector_id=self.id)
        }

    @api.model
    def init_free_test_record(self):
        if not self.search_count([]):
            self.create({
                'name': 'Free Test (apichat.io)',
                'connector_type': 'apichat.io',
                'source': '/',
                'uuid': 'free_test_account',
                'token': '123456',
                'tz': self.env.ref('base.user_admin').tz or 'UTC',
            })

    def action_ca_get_status(self):
        self.ensure_one()
        ret = self.ca_get_status()
        if not self.ca_status and self.ca_qr_code:
            return {
                'name': _('Scan QR code'),
                'type': 'ir.actions.act_window',
                'view_mode': 'form',
                'res_model': 'acrux.chat.connector.scanqr.wizard',
                'target': 'new',
                'context': dict(default_connector_id=self.id)
            }
        else:
            return ret

    def assert_id(self, key):
        self.ensure_one()
        if not self.env.context.get('from_webhook') and not self.is_facebook_or_instagram():
            if key != self.clean_id(key):
                raise ValidationError(_('Invalid number'))
            phone_format(key, formatted=False)  # to check

    def clean_id(self, key):
        self.ensure_one()
        if self.is_facebook_or_instagram():
            return key
        return clean_number(key)

    def format_id(self, key):
        self.ensure_one()
        if self.is_facebook():
            return 'Facebook'
        elif self.is_instagram():
            return 'Instagram'
        simple = '+%s' % clean_number(key)
        formatted = phone_format(key, formatted=True, raise_error=False)
        reverse = '+%s' % clean_number(formatted)
        return formatted if simple == reverse else simple

    def allow_caption(self):
        self.ensure_one()
        if self.is_owner_facebook():
            return self.is_waba_extern()
        return True

    def update_template_waba(self):
        data = self.ca_request('template_get')
        Template = self.env['acrux.chat.template.waba']
        Template.create_or_update(data, self)
        return self.env['acrux.chat.pop.message'].message(_('Templates updated.'))

    def get_url_from_attachment(self, attach_id):
        self.ensure_one()
        access_token = attach_id.generate_access_token()[0]
        url = '/web/chatresource/%s/%s' % (attach_id.id, access_token)
        base_url = self.odoo_url.rstrip('/')
        return base_url.rstrip('/') + url

    def get_url_from_model_field(self, record, field, field_obj=None):
        hash_id = hashlib.sha1(str((record.write_date or record.create_date or '')).encode('utf-8'))
        hash_id = hash_id.hexdigest()[0:7]
        url = '/web/static/chatresource/%s/%s_%s/%s' % (record._name, record.id, hash_id, field)
        base_url = self.odoo_url.rstrip('/')
        return base_url.rstrip('/') + url

    def _compute_hide_branding(self):
        hide_branding = self.env['ir.config_parameter'].sudo().get_param('chatroom.hide.branding', 'False') == 'True'
        for record in self:
            record.chatroom_hide_branding = hide_branding

    def get_facebook_path(self, path):
        if path == 'config_set':
            path = 'config'
        elif path == 'contact_get':
            path = 'contact'
        elif path == 'send':
            path = 'sendMessage'
        elif path == 'msg_set_read':
            if self.is_instagram():  # instagram no soporta marcar como leido
                path = None
            else:
                path = 'readChat'
        elif path == 'status_logout':
            path = 'logout'
        elif path == 'template_get':  # facebook e instagram no soprotan
            path = 'templates' if self.is_waba_extern() else None
        return path

    def process_facebook_get_status(self, data):
        self.ensure_one()
        message = detail = False
        redirectData = True
        if 'is_connected' in data:
            if data['is_connected']:
                detail = _('Connected.')
                message = 'Status'
                self.ca_status = True
                self.message = detail
                self.ca_set_settings()
            else:
                message = 'Status'
                detail = data.get('reason', _('An unexpected error occurred'))
                self.ca_status = False
                self.message = detail
        elif 'url' in data:
            redirectData = {
                'type': 'ir.actions.act_url',
                'url': data['url'],
                'target': 'self',
            }
        else:
            self.ca_status = False
            message = 'An unexpected error occurred. Please try again.'
            self.message = message
        return message, detail, redirectData

    def is_facebook_or_instagram(self):
        return self.connector_type in ['facebook', 'instagram']

    def is_owner_facebook(self):
        return self.connector_type in ['facebook', 'instagram', 'waba_extern']

    def is_facebook(self):
        return self.connector_type == 'facebook'

    def is_instagram(self):
        return self.connector_type == 'instagram'

    def is_waba_extern(self):
        return self.connector_type == 'waba_extern'
