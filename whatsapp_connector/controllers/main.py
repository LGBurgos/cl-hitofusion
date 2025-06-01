# -*- coding: utf-8 -*-
import logging
import json
import warnings
import os
import subprocess
from io import BytesIO
from werkzeug.datastructures import FileStorage
from tempfile import NamedTemporaryFile
from odoo import http, _
from odoo.http import request, Response
from odoo.exceptions import UserError
from odoo.addons.base.models.ir_qweb import QWebException
from psycopg2 import OperationalError
from psycopg2.extensions import TransactionRollbackError
from ..models.Message import INSTAGRAM_AUDIO_FORMAT_ALLOWED, INSTAGRAM_VIDEO_FORMAT_ALLOWED
from ..models.WcMessage import WECHAT_AUDIO_FORMAT_ALLOWED, WECHAT_VIDEO_FORMAT_ALLOWED
_logger = logging.getLogger(__name__)


try:
    saved_warning_state = warnings.filters[:]
    warnings.simplefilter('ignore')
    import pydub
except Exception:
    pydub = None
finally:
    warnings.filters = saved_warning_state


def log_request(req):
    pass


def acrux_allowed_models():
    return ['product.template', 'product.product', 'acrux.chat.new.group.wizard', 'acrux.chat.conversation']


class WebhookController(http.Controller):

    @http.route('/acrux_webhook/whatsapp_connector/<string:connector_uuid>/process',
                auth='public', type='json', methods=['POST'])
    def acrux_process(self, connector_uuid, **post):
        ''' Keeping "Account ID" secret. '''
        try:
            log_request(request)
            Connector = request.env['acrux.chat.connector'].sudo()
            connector_id = Connector.search([('uuid', '=', connector_uuid)], limit=1)
            if not connector_id or not connector_uuid:
                return Response(status=403)  # Forbidden

            WorkQueue = request.env['acrux.chat.work.queue'].sudo()
            WorkQueue._cron_process_queue([connector_id.id])
        except (TransactionRollbackError, OperationalError, QWebException) as e:
            raise e
        except Exception:
            request.env.cr.rollback()
            _logger.error('Error', exc_info=True)

        return Response(status=200)

    @http.route('/acrux_webhook/whatsapp_connector/<string:connector_uuid>',
                auth='public', type='json', methods=['POST'])
    def acrux_webhook(self, connector_uuid, **post):
        ''' Keeping "Account ID" secret. '''
        try:
            if not post:
                return Response(status=403)  # Forbidden
            log_request(request)

            updates = post.get('updates', [])
            events = post.get('events', [])
            messages = post.get('messages', [])
            if not updates and not events and not messages:
                return Response(status=403)  # Forbidden

            Connector = request.env['acrux.chat.connector'].sudo()
            connector_id = Connector.search([('uuid', '=', connector_uuid)], limit=1)
            if not connector_id or not connector_uuid:
                return Response(status=403)  # Forbidden

            WorkQueue = request.env['acrux.chat.work.queue'].sudo()
            queue_ids = request.env['acrux.chat.work.queue'].sudo()
            for contact in updates:
                queue_ids |= WorkQueue.create({
                    'ttype': 'in_update',
                    'connector_id': connector_id.id,
                    'data': json.dumps(contact)
                })

            for event in events:
                queue_ids |= WorkQueue.create({
                    'ttype': 'in_event',
                    'connector_id': connector_id.id,
                    'data': json.dumps(event)
                })

            for mess in messages:
                queue_ids |= WorkQueue.create({
                    'ttype': 'in_message',
                    'connector_id': connector_id.id,
                    'data': json.dumps(mess)
                })
            return {'status': 'ok'}
        except (TransactionRollbackError, OperationalError, QWebException) as e:
            raise e
        except Exception:
            request.env.cr.rollback()
            _logger.error('Error', exc_info=True)
            return Response(status=500)  # Internal Server Error

    @http.route(['/web/chatresource/<int:id>/<string:access_token>',
                 '/web/static/chatresource/<string:model>/<string:id>/<string:field>'],
                type='http', auth='public', sitemap=False)
    def acrux_web_content(self, id=None, model=None, field=None, access_token=None):
        '''
        /web/chatresource/...        -> for attachment
        /web/static/chatresource/... -> for product image
        :param field: field (binary image, PNG or JPG) name in model. Only support 'image'.
        '''

        IrBinary = request.env['ir.binary'].sudo()
        try:
            if id and access_token and not model and not field:
                record = IrBinary._find_record(res_id=int(id), access_token=access_token)
                stream = IrBinary._get_stream_from(record)
            else:
                if not id or not field.startswith('image') or model not in acrux_allowed_models():
                    return Response(status=404)

                id, sep, unique = id.partition('_')
                record = IrBinary._find_record(res_model=model, res_id=int(id))
                stream = IrBinary._get_image_stream_from(record, field_name=field,
                                                         placeholder='web/static/img/XXXXX.png')
        except Exception:
            return Response(status=404)

        response = stream.get_response()
        return response


class Binary(http.Controller):

    @http.route('/web/binary/upload_attachment_chat', methods=['POST'], type='http', auth='user')
    def mail_attachment_upload(self, ufile, is_pending=False, connector_type=None, **kwargs):
        ''' Source: web.controllers.discuss.DiscussController.upload_attachment '''
        if ufile and ufile.mimetype:
            if (connector_type == 'instagram'):
                ufile = self.check_instagram_file(ufile)
            elif (connector_type == 'wechat'):
                ufile = self.check_wechat_file(ufile)
        try:
            limit = int(request.env['ir.config_parameter'].sudo().get_param('acrux_max_weight_kb') or '0')
            Attach = request.env['ir.attachment']
            datas = ufile.read()
            if len(datas) > limit * 1024:
                raise UserError(_('Too big, max. %s (%s)') % ('%sMb' % int(limit / 1000), ufile.filename))
            vals = {
                'name': ufile.filename,
                'raw': datas,
                'res_id': 0,
                'res_model': 'acrux.chat.message',
                'delete_old': True,
                'public': True
            }
            if is_pending and is_pending != 'false':
                # Add this point, the message related to the uploaded file does
                # not exist yet, so we use those placeholder values instead.
                vals.update({
                    'res_id': 0,
                    'res_model': 'acrux.chat.message',
                })
            vals['access_token'] = Attach._generate_access_token()
            attachment = Attach.create(vals)
            if ufile.mimetype:
                attachment.mimetype = ufile.mimetype
            attachment._post_add_create()
            attachmentData = {
                'filename': ufile.filename,
                'id': attachment.id,
                'mimetype': attachment.mimetype,
                'name': attachment.name,
                'size': attachment.file_size,
                'isAcrux': True,
            }
            if attachment.access_token:
                attachmentData['accessToken'] = attachment.access_token
        except UserError as e:
            attachmentData = {'error': e.args[0], 'filename': ufile.filename}
            _logger.exception("Fail to upload attachment %s" % ufile.filename)
        except Exception:
            attachmentData = {'error': _("Something horrible happened"), 'filename': ufile.filename}
            _logger.exception("Fail to upload attachment %s" % ufile.filename)
        return request.make_response(
            data=json.dumps(attachmentData),
            headers=[('Content-Type', 'application/json')]
        )

    def check_instagram_file(self, ufile):
        file_type = ufile.mimetype.split('/')[0]
        if (not pydub or file_type not in ['audio', 'video'] or
                ufile.mimetype in INSTAGRAM_AUDIO_FORMAT_ALLOWED or
                ufile.mimetype in INSTAGRAM_VIDEO_FORMAT_ALLOWED):
            return ufile
        data = ufile.read()
        try:
            if file_type == 'audio':
                output_io = self.convert_audio(data)
            else:
                output_io = self.convert_video_to_mp4(data, ufile.filename)
            ufile = FileStorage(stream=output_io, filename=f'{file_type}.mp4', content_type=f'{file_type}/mp4')
        except Exception as e:
            _logger.error(e)
            ufile = FileStorage(stream=BytesIO(data), filename=ufile.filename, content_type=ufile.mimetype)
        return ufile

    def check_wechat_file(self, ufile):
        file_type = ufile.mimetype.split('/')[0]
        if (not pydub or file_type not in ['audio', 'video'] or
                ufile.mimetype in WECHAT_AUDIO_FORMAT_ALLOWED or
                ufile.mimetype in WECHAT_VIDEO_FORMAT_ALLOWED):
            return ufile
        data = ufile.read()
        try:
            if file_type == 'audio':
                output_io = self.convert_audio(data, audio_format='mp3')
                ufile = FileStorage(stream=output_io, filename=f'{file_type}.mp3', content_type=f'{file_type}/mp3')
            else:
                output_io = self.convert_video_to_mp4(data, ufile.filename)
                ufile = FileStorage(stream=output_io, filename=f'{file_type}.mp4', content_type=f'{file_type}/mp4')
        except Exception as e:
            _logger.error(e)
            ufile = FileStorage(stream=BytesIO(data), filename=ufile.filename, content_type=ufile.mimetype)
        return ufile

    def convert_audio(self, data, audio_format='mp4'):
        file_like = BytesIO(data)
        audio = pydub.AudioSegment.from_file(file_like)
        output_io = BytesIO()
        audio.export(output_io, format=audio_format)
        return output_io

    def convert_video_to_mp4(self, data, filename):
        output_io = BytesIO(data)
        encoder = pydub.utils.get_encoder_name()
        if encoder:
            in_file = NamedTemporaryFile(mode='wb', suffix='.' + filename.split('.')[-1], delete=False)
            in_file.write(data)
            in_file.seek(0)
            output = NamedTemporaryFile(mode='w+b', suffix='.mp4', delete=False)
            conversion_command = [
                encoder, '-y', '-i', in_file.name,
                '-acodec', 'aac',
                '-vcodec', 'libx264',
                '-f', 'mp4', output.name
            ]
            with open(os.devnull, 'rb') as devnull:
                p = subprocess.Popen(conversion_command, stdin=devnull, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
                _p_out, p_err = p.communicate()
            if p.returncode != 0:
                in_file.close()
                output.close()
                raise Exception(p_err.decode(errors='ignore'))
            output.seek(0)
            output_io = BytesIO(output.read())
            output.close()
            in_file.close()
        return output_io
