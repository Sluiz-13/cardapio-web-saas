export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-chalk px-5 py-10">
      <div className="max-w-2xl mx-auto bg-paper rounded-sm p-6">
        <h1 className="font-display text-2xl uppercase mb-4">Privacidade dos seus dados</h1>

        <div className="space-y-4 text-sm text-ink/80">
          <p>
            Para processar seu pedido, coletamos seu nome, telefone e, quando o pedido é para
            entrega, seu endereço. Esses dados são usados exclusivamente para preparar, entregar
            e cobrar o seu pedido.
          </p>
          <p>
            <strong>Base legal:</strong> tratamos esses dados com base na execução do contrato
            firmado no momento da compra (art. 7º, V da LGPD) — ou seja, são o mínimo necessário
            para que seu pedido chegue até você.
          </p>
          <p>
            <strong>Compartilhamento:</strong> seu nome e telefone podem ser compartilhados com o
            entregador designado para esse pedido. Não vendemos nem compartilhamos seus dados com
            terceiros para fins de marketing.
          </p>
          <p>
            <strong>Retenção:</strong> dados de identificação (nome, telefone, endereço) de
            pedidos finalizados são removidos automaticamente após um período determinado. O valor
            e os itens do pedido podem ser mantidos por mais tempo para fins contábeis, mas sem
            vínculo com sua identidade.
          </p>
          <p>
            <strong>Seus direitos:</strong> você pode solicitar a qualquer momento a confirmação,
            correção ou exclusão dos seus dados, entrando em contato diretamente com o
            estabelecimento.
          </p>
        </div>
      </div>
    </div>
  );
}