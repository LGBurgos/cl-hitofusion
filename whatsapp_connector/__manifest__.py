# -*- coding: utf-8 -*-
# =====================================================================================
# License: OPL-1 (Odoo Proprietary License v1.0)
#
# By using or downloading this module, you agree not to make modifications that
# affect sending messages through Acruxlab or avoiding contract a Plan with Acruxlab.
# Support our work and allow us to keep improving this module and the service!
#
# Al utilizar o descargar este módulo, usted se compromete a no realizar modificaciones que
# afecten el envío de mensajes a través de Acruxlab o a evitar contratar un Plan con Acruxlab.
# Apoya nuestro trabajo y permite que sigamos mejorando este módulo y el servicio!
# =====================================================================================
{
    'name': 'ChatRoom BASE Whatsapp - Messenger - Instagram. Live Chat. Real All in One with ChatGPT OpenAI '
            'and Sale Funnels. Online translator.',
    'summary': 'From ChatRoom main view Search & Send Product. With ChatGPT OpenAI and Sale Funnel. Send message '
               'from many places with Templates (Sale, Invoice, Purchase, CRM Leads, Product, Stock Picking, Partner).'
               ' Like AmoCRM, Kommo, Hubspot, Zendesk. Online translator. Reminders. Text search in messages.'
               ' apichat.io GupShup Chat-Api ChatApi. Whatsapp, Instagram DM, FaceBook Messenger. ChatRoom 2.0.',
    'description': 'Send Product, Real All in One. Send and receive messages. Real ChatRoom. WhatsApp integration. '
                   'WhatsApp Connector. apichat.io. GupShup. Chat-Api. ChatApi. Drag and Drop. ChatRoom 2.0.',
    'version': '17.0.20.0',
    'author': 'AcruxLab',
    'live_test_url': 'https://chatroom.acruxlab.com/web/signup',
    'support': 'info@acruxlab.com',
    'price': 99.2,
    'currency': 'USD',
    'images': ['static/description/Banner_base_v14.gif'],
    'website': 'https://acruxlab.com/plans',
    'license': 'OPL-1',
    'application': True,
    'installable': True,
    'category': 'Discuss/Sales/CRM',
    'depends': [
        'bus',
        'sales_team',
        'product'
    ],
    'data': [
        'data/data.xml',
        'data/cron.xml',
        'data/ai_config_data.xml',
        'data/mail_activity_type_data.xml',
        'security/security.xml',
        'security/ir.model.access.csv',
        'wizard/CustomMessage.xml',
        'wizard/init_free_test.xml',
        'wizard/MessageWizard.xml',
        'wizard/ScanQr.xml',
        # 'wizard/SimpleNewConversation.xml',  # eliminar definitivo?
        'views/ir_attachment.xml',
        'views/template_button_views.xml',
        'views/template_list_views.xml',
        'views/default_answer_views.xml',
        'views/connector_views.xml',
        'views/conversation_views.xml',
        'views/conversation_stage_views.xml',
        'views/conversation_tags_views.xml',
        'views/message_views.xml',
        'views/res_partner.xml',
        'views/res_users_views.xml',
        'views/module_views.xml',
        'views/template_waba_views.xml',
        'views/mail_template_views.xml',
        'views/ai_config_views.xml',
        'views/ai_interface_views.xml',
        'views/ai_usage_log_views.xml',
        'views/mail_activity_views.xml',
        'views/conversation_panel_views.xml',
        'wizard/AiInterface.xml',
        'wizard/AiInterfaceTest.xml',
        'reports/report_conversation_views.xml',
        'reports/report_agent_answer_time.xml',
        'reports/reports.xml',
        'views/res_config_settings_views.xml',
        'views/work_queue_views.xml',
        'views/menu.xml',
    ],
    'assets': {
        'web.assets_backend': [
            'whatsapp_connector/static/src/scss/*.scss',

            'whatsapp_connector/static/src/odooCore/*/*.xml',

            'whatsapp_connector/static/src/components/*/*.scss',
            'whatsapp_connector/static/src/components/*/*.xml',


            'whatsapp_connector/static/src/jslib/chatroom.js',
        ],
    },
    'post_load': '',
    'external_dependencies': {'python': ['phonenumbers']},

}
